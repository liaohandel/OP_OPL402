console.log("[linkgateway ] start webapp8-1 for Cube Vide 8001,8002,8003,8004  ...");

//var handelbuff = require('./handel_buffv03');
const express = require('express')
const app = express()

var bodyParser = require('body-parser');
var ngrok = require('ngrok');

var Client = require('node-rest-client').Client;
var client = new Client();
 
var path = require('path');
var fs = require('fs');
var os = require('os');

var util = require('util');
var exec = require('child_process').exec; 
var cmdStr = 'sudo pm2 restart webapp9v8000';

//link gateway pam 
var seturl = ""
var chkurl = ""
var linkchkcount = 0

var setport = 8022
var ddsnurl = "http://106.104.112.56/Cloud/API/linkbox.php"
var vdsnurl = "http://106.104.112.56/Cloud/API/videobox.php"
var devloadurl = "http://106.104.112.56/Cloud/API/linkbox.php"
var campos = "C922" //web cam 8001

var setdeviceip = 'https://c4915760.ngrok.io'
var setdeviceport = '000'
var setuuid = '3'

var setddsnurl = ddsnurl+'DeviceIP='+setdeviceip+'&DevicePort='+setdeviceport+'&UUID='+setuuid
//load startup paramemt for uuid
var filename = "PDDATA.txt"
var filepath = path.join(__dirname, ("/public/" + filename));


app.get('/', function (req, res) {
  //console.log(req.body)
  console.log(req.query.pin);
  res.send('Hello World 8001x1 !')
})

app.get('/connectcheck', function (req, res) {
    //console.log(req.body)
    console.log(req.query.pin);
    res.send("ready")
  })

app.get('/pwm', function (req, res) {
  console.log(req.query.pin);
  let datpin = req.query.pin
  jobj = { "pin" : datpin , "action" : "on" } 
  res.json(jobj);
  //res.send('Hello pwm!')
})

app.listen(setport, function () {    
    fs.readFile(filepath, function(err, content) {
        //res.writeHead(200, { 'Content-Type': 'text/plain' });
        let uuiddata = content.toString();
        //let jobj = JSON.parse(uuiddata);
		pdjobj= JSON.parse(uuiddata);
        //var jpam = jobj[0];
        //console.log(" txt find ok ! ... \n", uuiddata);
		//==========================================		
        ddsnurl = pdjobj.PDDATA.dsnurl;
        vdsnurl = pdjobj.PDDATA.videodsnurl;
		devloadurl =  pdjobj.PDDATA.devloadurl;
        setuuid =  pdjobj.PDDATA.UUID;
		
        console.log("uuids = ", setuuid);
        console.log("dsnurl = ", ddsnurl);
        console.log("videodsnurl = ",vdsnurl);//devloadur
        console.log("devloadur = ", devloadurl)
		
        //res.send(req.query.appfile + ' ' + req.query.index);
        //res.send(webstr); 
		
		if(pdjobj.PDDATA.linkoffmode != 1){	
			//ngrok.connect('192.168.5.80:22',function (err, url) {
			ngrok.connect({authtoken:"4JX7NJes3ow77vXRk5j3V_4UtjFF511xSkXd36cLd8H", proto:'tcp',addr:'192.168.5.116:22'},function (err, url) {
			//ngrok.connect(function (err, url) {
				seturl = url
				//chkurl = seturl+"/connectcheck"
				console.log("link=>"+seturl)
				//http://tscloud.opcom.com/Cloud/API/v2/UpdateIP?UUID=OFA1C002DB290C1F72CD5B0C&UpdateIP=https://ngrok.com/1111
				//setddsnurl = vdsnurl+'?UUID='+setuuid+'&DeviceIP='+seturl+'&DevicePOS='+campos
				base_updateurl="http://tscloud.opcom.com/Cloud/API/v2/UpdateIP"
				updateddsnurl = base_updateurl+'?UUID='+setuuid+'&UpdateIP='+seturl
				
				console.log("link=>"+seturl)
				client.get(updateddsnurl, function (data, response) {
					console.log("upload ssh url  ok...") 
					
					// setInterval(function(){
						// //console.log('test link ...');
						// linkchkcount=3;
						// if(((typeof seturl) == "undefined" ) || (linkchkcount >=3) ){
							// console.log("get x11...") 
							// ngrok.disconnect(); // stops all
							// //reloadddsn();
							// exec(cmdStr, function(){
								// console.log("restart link  v8000 ... ")
							// });
						// }
					// }, 240 * 60 * 1000);
					
				});
				
			});
		}
	});   

    console.log('Example ssh ddns login app listening on port 8022!')
})

// function reloadddsn(){	
    // console.log('recall ngrok ...');
	// ngrok.connect('192.168.5.81:8001',function (err, url) {
		// seturl = url
        // //chkurl = seturl+"/connectcheck"
		// console.log("link 8v1=>"+seturl);
        // setddsnurl = vdsnurl+'?UUID='+setuuid+'&DeviceIP='+seturl+'&DevicePOS='+campos
		// client.get(setddsnurl, function (data, response) {
			// console.log("get ok...") 				
		// });			
	// });
// }