const User = require("../models/Users");
const Comment = require("../models/Comments");

// ------------------------
// יצירת משתמש חדש
// ------------------------
exports.createUser = async (req, res) => {
  try {
    const { username, passwordHash, age, city, advancedInfo } = req.body;

    // בדיקות בסיסיות
    if (!username || !passwordHash || age == null || !city) {
      return res.status(400).json({ error: "חובה למלא: username, password, age, city" });
    }

    // בדיקות advancedInfo אם נשלח
    if (advancedInfo) {
      const { profession, educationPlace, experienceYears } = advancedInfo;
      if (!profession || !educationPlace || experienceYears == null) {
        return res.status(400).json({ 
          error: "אם מוסיפים advancedInfo, חובה למלא: profession, educationPlace, experienceYears" 
        });
      }
    }

    const newUser = new User({ username, passwordHash, age, city, advancedInfo });
    await newUser.save();
    res.status(201).json(newUser);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה ביצירת המשתמש" ,err:err});
  }
};

// ------------------------
// עדכון משתמש לפי ID
// ------------------------
exports.updateUser = async (req, res) => {
  try {
    const { username, age, city, advancedInfo } = req.body;

    // בדיקה שיש שדות לעדכון
    if (!username && !age && !city && !advancedInfo) {
      return res.status(400).json({ error: "אין שדות לעדכון" });
    }

    // בדיקות advancedInfo אם נשלח
    if (advancedInfo) {
      const { profession, educationPlace, experienceYears } = advancedInfo;
      if (!profession || !educationPlace || experienceYears == null) {
        return res.status(400).json({ 
          error: "אם מעדכנים advancedInfo, חובה למלא: profession, educationPlace, experienceYears" 
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { username, age, city, advancedInfo },
      { new: true, runValidators: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "משתמש לא נמצא" });
    res.json(updatedUser);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בעדכון המשתמש" });
  }
};

// ------------------------
// מחיקת משתמש לפי ID
// ------------------------
exports.deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: "משתמש לא נמצא" });

    res.json({ message: "משתמש נמחק בהצלחה" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה במחיקת המשתמש" });
  }
};

// ------------------------
// שליפת כל המשתמשים
// ------------------------
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("comments");
    res.json(users);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת המשתמשים" });
  }
};

// ------------------------
// שליפת משתמש לפי ID
// ------------------------
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("comments");
    if (!user) return res.status(404).json({ error: "משתמש לא נמצא" });

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת המשתמש" });
  }
};

// ------------------------
// שליפת משתמש לפי תגובה (Comment ID)
// ------------------------
exports.getUserByComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId).populate("user");
    if (!comment) return res.status(404).json({ error: "תגובה לא נמצאה" });

    const user = await User.findById(comment.user._id).populate("comments");
    if (!user) return res.status(404).json({ error: "משתמש לא נמצא" });

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "שגיאה בשליפת המשתמש לפי תגובה" });
  }
};




// const User=require("../models/Users")

// const createNewUser=async(req,res) => {
//     const{name,username,email,address,phone}=req.body
//     if(!name||!username)
//         return res.status(400).send("name and username are requierd")
//     const user=await User.create({name,username,email,address,phone})
//     if (user)
//         return res.status(200).json(user)
//     else
//         return res.status(400).send("error")

// }

// const getaUserrs=async (req,res)=>{
//     const user=await User.find()
//     if(!user)
//         return res.status(400).send("not foubd")
//     res.json(user)
// }


// const updateUser=async (req,res)=>{
//     const{id,name,username,email,address,phone}=req.body
//     if(!id||!name||!username)
//         return res.send("id, name and username are required")
//     const user=await User.findById(id)
//     if(!user)
//         return res.status(400).send("not foubd")
//     user.name=name
//     user.username=username
//     user.email=email
//     user.address=address
//     user.phone=phone
//     const upt=await user.save()
//     res.json(upt)
// }

// const deleteUser=async(req,res)=>{
//     const {id}=req.body
//     const user=await User.findById(id)
//     if(!user)
//         return res.status(400).send("not foubd")
//     const resukt=await user.deleteOne()
//     const reply=`user'${resukt.name}'id ${resukt._id} deleted`
//     res.json(reply)
// }

// module.exports={createNewUser,getaUserrs,updateUser,deleteUser}
