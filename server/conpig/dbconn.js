const mongoose=require("mongoose")

const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.DATABASE_URI)
        console.log("Connected to DB")
    }catch(err){
        console.error("DB Connection Error:", err)
        throw err
    }
    
}
module.exports=connectDB
