import mongoose from "mongoose";

mongoose.connect(`mongodb://127.0.0.1:27017/Mental-Health`);

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password:String
});

const userModel = mongoose.model("user",userSchema);
export default userModel;