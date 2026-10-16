import { useState } from "react";

const [status, setStatus] = useState<"empty" | "ready" | "posting" | "error">("empty");


