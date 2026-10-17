"use client"

import { useState } from "react";

export function Post() {
const [status, setStatus] = useState<"empty" | "ready" | "posting" | "error">("empty");
const [content, setContent] = useState("");

return(
    <form>
        <textarea
        value={content}
        onChange={ (e) => {
            const text = e.target.value;
            setContent(text);
            setStatus(text.trim() === "" ? "empty" : "ready");
            }}
        />
    </form>
)
}

