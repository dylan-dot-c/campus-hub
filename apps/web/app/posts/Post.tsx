"use client"

import { useState } from "react";

export function Post() {
const [status, setStatus] = useState<"empty" | "ready" | "posting" | "error">("empty");
const [content, setContent] = useState("");
const [title, setTitle] = useState("");
const [errorMes, setErrorMes] = useState("");

//submit
async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("posting");

    try{
    //sends the post to API 
    const res = await fetch("/api/posts", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body:  JSON.stringify({title, content})
    }
    )
    if(res.ok){ //The post was successful, server saved the post to database.
        setTitle("");
        setContent("");
        setStatus("empty")
    }else{
        const err = await res.json();
        setErrorMes(err.error.message);
        setStatus("error");
    }
}catch{
    setErrorMes("Could Not Reach Server, Try Again Later.");
    setStatus("error");
}
}

const canSubmit = status === "ready" || status === "error";

return(
    <form onSubmit={submit}>
        <input
        value={title}
        onChange={ (e) => {
            const text = e.target.value;
            setTitle(text);
            setStatus(text.trim() === "" ? "empty" : "ready");
            }}
        ></input>
        <textarea
        value={content}
        onChange={ (e) => setContent(e.target.value)}
        />
         {status === "error" && <p>{errorMes}</p>}   
        <button type="submit" disabled={!canSubmit}>Post</button>
    </form>
)
}

