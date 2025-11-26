import { app } from "./app";
import { config, connectDatabase } from "./config";

// Connect to Database
connectDatabase();

// Start Server
app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
