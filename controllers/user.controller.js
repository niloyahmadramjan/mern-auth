import { email } from "zod";
import { registerSchema } from "../config/zod.js";
import tryCatch from "../middleware/tryCatch.js";
import sanitize from "mongo-sanitize";

export const registerUser = tryCatch(async (req, res) => {
  const sanitizeBody = sanitize(req.body);
  const validation = registerSchema.safeParse(sanitizeBody);

  if (!validation.success) {
    const zodError = validation.error;

    let allError = [];
    let firstErrorMessage = "Validation failed"; // default fallback

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allError = zodError.issues.map((issue) => ({
        field: issue.path?.join(".") || "unknown",
        message: issue.message || "Validation Error",
        code: issue.code || "unknown_code",
      }));
    }

    // Pick first error message if exists
    firstErrorMessage = allError[0]?.message || firstErrorMessage;

    return res.status(400).json({
      message: firstErrorMessage,
      error: allError,
    });
  }

  const { name, email, password } = validation.data;
  console.log(validation);

  res.status(200).json({ name, email, password });
});
