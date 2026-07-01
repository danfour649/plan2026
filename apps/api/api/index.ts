import { handle } from "hono/vercel";

import { app } from "@api/app";

export default handle(app);
