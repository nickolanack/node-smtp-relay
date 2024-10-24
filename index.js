const { SMTPServer } = require('smtp-server');
const simpleParser = require('mailparser').simpleParser;
const fs = require('fs');
const path = require('path');



const sanitizeEmailForFileName=(email)=>{
    return email.replace(/[@.]/g, '_');
};

const getUnixTimestampWithMicroseconds=() =>{
    const [seconds, nanoseconds] = process.hrtime();  // High-res time [seconds, nanoseconds]
    const milliseconds = Date.now();  // Current time in milliseconds
    const microseconds = Math.floor(nanoseconds / 1000);  // Convert nanoseconds to microseconds
    const totalMicroseconds = `${milliseconds}${String(microseconds).padStart(6, '0')}`; // Concatenate ms and μs
    return totalMicroseconds;
}

// Create the SMTP server with TLS enabled
([25, 587]).forEach((port)=>{
    const server = new SMTPServer({
    // Load SSL certificates
    key: fs.readFileSync(path.join(config.certpath, 'privkey.pem')),
    cert: fs.readFileSync(path.join(config.certpath, 'fullchain.pem')),

    // Enable TLS (STARTTLS)
    secure: false,  // For STARTTLS on port 587, use 'secure: false'
    onAuth(auth, session, callback) {
        callback(null, { user: 'any-user' }); // Accept all users
    },

    onData(stream, session, callback) {
        simpleParser(stream)
        .then(parsed => {
            console.log(port+": \n"+JSON.stringify(session, null, '  '));
            console.log(port+": \n"+JSON.stringify(Object.keys(parsed), null, '  '));
            
            console.log('sender: '+session.envelope.mailFrom.address);
            console.log('to: '+parsed.to.text);
            console.log('from: '+parsed.from.text);
            console.log('subject: '+parsed.subject);
            console.log('text: '+parsed.text);

            jsonData = JSON.stringify(parsed, null, 2);


            const safeFileName = sanitizeEmailForFileName(parsed.to.text.trim().split(' ').pop());
            const timestamp = getUnixTimestampWithMicroseconds();

            const filePath=path.join(__dirname, `/mail/${safeFileName}.${timestamp}.json`);

            fs.writeFile(filePath, jsonData, (err) => {
                if (err) {
                    console.error('Error writing to file:', err);
                } else {
                    console.log(`File saved as ${safeFileName}.json`);
                }
            });

        })
        .catch(err => {
            console.error('Error parsing email: %s', err);
        })
        .finally(() => callback());
    },

    // Advertise TLS support to clients
    onConnect(session, callback) {
        return callback();  // Proceed with connection
    },
    //logger: true,  // Enable logging
    banner: "Greetings, User...",
    authOptional:true
    });

    // Start listening on port 587 (STARTTLS)
    server.listen(port, () => {
        console.log('SMTP server with TLS is listening on port ' + port);
    });

    server.on("error", (err) => {
        console.log("Error %s", err.message);
      });

})