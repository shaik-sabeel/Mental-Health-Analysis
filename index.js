import express from "express";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt"
import { dirname } from "path";
import { fileURLToPath } from "url";
import userModel from "./models/userModel.js";
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import path from 'path';
const PORT = process.env.PORT || 3000;


dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json()); 
app.use(cookieParser());

function generateCaptcha() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let captcha = '';
    for (let i = 0; i < 6; i++) {
        captcha += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return captcha;
}
var captchaIn;


function isLoggedin(req,res,next){
    if(req.cookies.token==="") return res.redirect('/');
    else{
        try{
        let data = jwt.verify(req.cookies.token,"secret");
        req.user = data;
        console.log(req.user)
        }
        catch{
            res.redirect('/');
        }
    }
    next();
}


app.get("/",(req,res)=>{
    res.render("home.ejs");
});


app.get("/register",(req,res)=>{
    res.render("register.ejs");
});

app.post("/register_submit",async(req,res)=>{
    let {username,email,password} = req.body;
    
    try{

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async (err,hash)=>{
            var createdUser = await userModel.create({
                username,
                email,
                password:hash
            })
            // res.send(createdUser);
            let token = jwt.sign({email:email,id:createdUser._id},"secret");
            res.cookie("token",token,{maxAge:1000*60*60*24});
            console.log(req.cookies.token)
            res.redirect('/home')
        })
    })    
    
    
}
catch(err){
    res.render("register.ejs",{error:"Email already registered!"});
}
});

app.get("/login",(req,res)=>{
    captchaIn=generateCaptcha();
    res.render("login.ejs",{captcha:captchaIn});
});

app.get("/home",isLoggedin,async(req,res)=>{
    console.log(req.cookies.token)
    let data = req.user;
    let email = data.email;
    let db_data = await userModel.findOne({email})
    res.render("home1.ejs",{name: db_data.username});
})




app.post('/login_submit',async (req,res)=>{
    var {email,password,captcha} = req.body;
    let userData =await userModel.findOne({email:email});
    if(userData){
    let hash = userData.password;
    let username = userData.username;
    bcrypt.compare(password, hash, function(err, result) {
    if(result){
        if(captchaIn!==captcha){
        return res.render("login.ejs",{captchaMsg:"Captcha incorrect, try again",captcha:captchaIn});
        }
        let token = jwt.sign({email:email,id:userData._id},"secret");
        res.cookie("token",token,{maxAge:1000*60*60*24});
        console.log(req.cookies.token)
        // 
        res.redirect('/home')
    }
    else{
        res.send("Something went wrong");
    }

});
    }
    else{
        res.send("Something went wrong");
    }

})

app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect('/');
})


app.post("/score",isLoggedin,async(req,res)=>{
   let {stressLevel,sleepQuality,mood,socialInteraction,academicPressure}=req.body;
   let a = parseInt(stressLevel);
   let b = parseInt(sleepQuality);
   let c = parseInt(mood);
   let d = parseInt(socialInteraction);
   let e = parseInt(academicPressure);
   console.log(a+b+c+d+e);
   let averageScore = (a+b+c+d+e)/5;

   let email = req.user.email
    let userData = await userModel.findOne({email});
   userData.score.push(averageScore);
    await userData.save();

   if (averageScore >= 4) {
        // window.location.href = '/congratulations';
        res.redirect('/congratulations')
    } else if(averageScore >= 3 && averageScore < 4){
        //window.location.href = '/low';
        res.redirect('/low')
    }else if (averageScore >= 2 && averageScore < 3) {
        //window.location.href = '/moderate_exercises';
        res.redirect('/moderate_exercises')
    } else if (averageScore >= 1 && averageScore < 2) {
        //window.location.href = '/improvement_exercises';
        res.redirect('/improvement_exercises')
    } else if (averageScore >= 0 && averageScore < 1) {
        //window.location.href = '/confidence_exercises';
        res.redirect('/confidence_exercises')
    }
})

app.get("/AI_assistance.html" , (req,res)=>{
    res.sendFile(__dirname+"/mental_health_web4_speech.html");
});

app.get("/indexM.html",(req,res)=>{
    res.sendFile(__dirname+"/indexM.html");
});
//
app.get("/congratulations",(req,res)=>{
    res.sendFile(__dirname+"/Exercises/congratulations.html");
});

app.get("/moderate_exercises",(req,res)=>{
    res.sendFile(__dirname+"/Exercises/moderate_exercises.html");
});

app.get("/improvement_exercises",(req,res)=>{
    res.sendFile(__dirname+"/Exercises/exercises.html");
});

app.get("/confidence_exercises",(req,res)=>{
    res.sendFile(__dirname+"/Exercises/confidence_exercises.html");
});

app.get("/low",(req,res)=>{
    res.sendFile(__dirname+"/Exercises/low_exercises.html");
});

app.get("/support",(req,res)=>{
    res.render("support.ejs");
});

// app.get("/plot",(req,res)=>{
//     res.render("");
// });

app.get('/plot',isLoggedin, async(req, res) => {
//   const x = req.body.x;
//   const y = req.body.y;
    let email = req.user.email;
    let userData = await userModel.findOne({email});
    let scores = userData.score;
  // Call Python script
  exec(`python plot.py "${scores}" `, (err) => {
    // "${y}"
    if (err) {
      console.error(err);
      return res.send("Error generating plot.");
    }
    // res.send(`
    //   <h2>Generated Plot:</h2>
    //   <img src="/static/plot.png" alt="Dynamic Plot" />
    //   <br><a href="/home">Go back</a>
    // `);
    res.render('plot.ejs');
  });
});

// app.get('/call',(req,res)=>{
//     exec(`python hello.py`, (err) => {
//     if (err) {
//       console.error(err);
//       return res.send("Error generating plot.");
//     }
//     res.send("success")
//   });
// })


if (!process.env.GEMINI_API_KEY) {
  console.error("Missing Gemini API Key in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/chatbot', (req, res) => {
  res.render('index.ejs', { error: null });
});

app.post('/chat', async (req, res) => {
  const userInput = req.body.feeling;

  const prompt = `
You are a kind and empathetic mental health assistant for students.

Student says: "${userInput}"

Your response must:
1. Start with a positive or calming suggestion (breathing, walk, music, journaling, etc.)
2. Include a light-hearted, clean joke or fun tip to lift mood (if appropriate)
3. If the student sounds severely anxious or depressed, recommend talking to a counselor or professional.

Be concise, warm, and non-judgmental.
`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
 // same approach as resume analyzer
    const result = await model.generateContent(prompt);
    const output = await result.response.text();

    if (!output || output.trim().length === 0) {
      throw new Error("Empty response from Gemini.");
    }

    res.render('response.ejs', { input: userInput, output});
  } catch (err) {
    console.error("Gemini Error:", err.message);
    res.render('index.ejs', { error: "Sorry, something went wrong. Please try again." });
  }
});





app.listen(port,()=>{
    console.log(`Listening in port ${port}`);
});

