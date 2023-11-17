module.exports = {
    name: 'NAME', // name of the event - this is the name of the file.
    once: BOOLEAN, // true or false - if true, the event will only run once. If false, it will run whenever the event is called.
    run (/*args...,*/ token) { // args... are the arguments that the event will take. 
    						   // token is the token of the bot.
        // code to run when the event is called.

    }
}