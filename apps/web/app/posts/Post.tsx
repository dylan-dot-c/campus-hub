"use client"

import { useRouter } from "next/navigation";
import { useState } from "react";

export function Post() {
const [status, setStatus] = useState<"empty" | "ready" | "posting" | "error">("empty");
const [content, setContent] = useState("");
const [title, setTitle] = useState("");
const [errorMes, setErrorMes] = useState("");

const router = useRouter();

//submit
async function submit(e: React.FormEvent) {
    e.preventDefault();
    // aria-disabled doesn't block clicks; this does
    if (status === "posting") return;
    if (title.trim() === "") { // `required` lets a title of only spaces through
        setErrorMes("Title is required.");
        setStatus("error");
        return;
    }
    setStatus("posting");

    try{
    //sends the post to API 
    const res = await fetch("/api/posts", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body:  JSON.stringify({title, content}),
        signal: AbortSignal.timeout(10_000) // give up after 10 s instead of "posting" forever
    }
    )
    if(res.ok){ //The post was successful, server saved the post to database.
        setTitle("");
        setContent("");
        setStatus("empty");
        router.refresh();
    }else{
        const err = await res.json();
        setErrorMes(err.error.message);
        setStatus("error");
    }
}catch (err){
    if (err instanceof DOMException && err.name === "TimeoutError") {
        // The server may still have saved it, so reload the list to show the truth.
        setErrorMes("Not sure that saved. Check your posts below.");
        router.refresh();
    } else {
        setErrorMes("Could Not Reach Server, Try Again Later.");
    }
    setStatus("error");
}
}

const canSubmit = status !== "posting" && title.trim() !== "";

return(
    <form onSubmit={submit}>
    <label>Title: 
        <input
        id="title"
        className="border"
        required
        value={title}
        onChange={ (e) => {
            const text = e.target.value;
            setTitle(text);
            setStatus(text.trim() === "" ? "empty" : "ready");
            }}
        ></input>
        </label>
        <label>Content:
        <textarea
        className="border"
        value={content}
        onChange={ (e) => setContent(e.target.value)}
        /></label>
        <p role="alert">{status === "error" ? errorMes : ""}</p>

        <button type="submit" aria-disabled={!canSubmit}>Post</button>
    </form>
)
}

