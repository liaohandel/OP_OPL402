console.log("[linkgateway ] start opf402 webapp_gx8x2 20180731x1 ...");

var EventEmitter = require('events').EventEmitter; 
var event = new EventEmitter(); 

const express = require('express')
const app = express()

var bodyParser = require('body-parser');  //no use
var ngrok = require('ngrok');

var Client = require('node-rest-client').Client;
var client = new Client();
var cargs = {
    requestConfig: {
        timeout: 500,
        noDelay: true,
        keepAlive: true
    },
    responseConfig: {
        timeout: 1000 //response timeout 
    }
};

 
var path = require('path');
var fs = require('fs');
var os = require('os');

var util = require('util');
var exec = require('child_process').exec; 
//var start_cmdStr = 'sudo pm2 start /home/pi/opcom_prj/gotest6_opf402/ipcamssh8022set';
//var stop_cmdStr = 'sudo pm2 delete /home/pi/opcom_prj/gotest6_opf402/ipcamssh8022set';
var start_cmdStr = "sudo sh /home/pi/opcom_prj/gotest6_opf402/getssh.sh";
var stop_cmdStr = "sudo sh /home/pi/opcom_prj/gotest6_opf402/stopssh.sh";

var pdbuffer  = require('./pdbuffer_v02.js');
var autocmd = require('./autocmd_gx8.js');
var cmdcode = require("./handelrs485x2");

//OPF403  treeapi ###
//path => ./gotest5_opf403/tree/treeapi.js
var treeRoutes = require('./treeapi.js');

//OPF403  regcmdapi ###
//path => ./gotest5_opf403/regcmd/regcmd_gx8.js
var regcmdRoutes = require('./regcmd_gx8.js');

//var ch1com = require('./utx7x1')// rec oxfa and 0xfc command 
//var ch1com = require('./utx5x2')
//var ch3com = require('./utx5x3')
//var ch4com = require('./utx5x4')

//link gateway pam 
var seturl = ""
var chkurl = ""
var setport = 3000
var linkchkcount = 0

var ddsnurl = "http://106.104.112.56/Cloud/API/linkbox.php"
var vdsnurl = "http://106.104.112.56/Cloud/API/videobox.php"
var devloadurl = "http://106.104.112.56/Cloud/API/DeviceUpdate.php"
var typeloadurl = "http://106.104.112.56/Cloud/API/TypeUpdate.php"
var typechannelurl = "http://106.104.112.56/Cloud/API/TypeChannelsUpdate.php"

var dev85statusurl="http://106.104.112.56/Cloud/API/DeviceStatus.php"
var dev105statusurl="http://106.104.112.56/Cloud/API/ContainerStatus.php"


var offdev85statusurl="http://192.168.5.220/API/DeviceStatus.php"
var offdev105statusurl="http://192.168.5.220/API/ContainerStatus.php"
var offdevloadurl = "http://192.168.5.220/API/DeviceUpdate.php"
var offtypeloadurl = "http://192.168.5.220/API/TypeUpdate.php"
var offtypechannelurl = "http://192.168.5.220/API/TypeChannelsUpdate.php"


var setdeviceip = 'https://c4915760.ngrok.io'
var setdeviceport = '0000'
var setuuid = '1234567890abcdefghijk'
var activekeyurl = "http://106.104.112.56/Cloud/API/DeviceStatus.php"  //no use

var setddsnurl = ddsnurl+'?DeviceIP='+setdeviceip+'&UUID='+setuuid
var setvdsnurl = ddsnurl+'?DeviceIP='+setdeviceip+'&DevicePOS='+setdeviceport+'&UUID='+setuuid
var setdevouturl = devloadurl+"?UUID="+setuuid+"&result="+"{}"

//load startup paramemt for uuid
//var filename = "uuiddata.txt"
//var filename = "PDDATA.txt"
//var filepath = path.join(__dirname, ("/public/" + filename));
//var pdjobj ={}


//["C602","CA01","CA02","C101","C104","C107","C102","C103"],	//6
//["CA03","CA04","CA05","C105","C106"],	//7
var sbcount = 0;
var sensorbuff = [
	["H001"],["K001"]	//0,1
]

var regsensorbuff = [
	[
		{"POS":"H001","CMD":"RH","STU":"920000","Type":"AirRH"},
		{"POS":"K001","CMD":"RH","STU":"920000","Type":"AirRH"}
	],
	[
		{"POS":"K001","CMD":"RH","STU":"920000","Type":"AirRH"},
		{"POS":"H001","CMD":"TEMPERATURE","STU":"A10000","Type":"AirTemp"}
	],
	[
		{"POS":"H001","CMD":"TEMPERATURE","STU":"A10000","Type":"AirTemp"},
		{"POS":"K001","CMD":"TEMPERATURE","STU":"A10000","Type":"AirTemp"}
	],
	[
		{"POS":"H001","CMD":"RH","STU":"920000","Type":"AirRH"},
		{"POS":"K001","CMD":"TEMPERATURE","STU":"A10000","Type":"AirTemp"}
	]
]

//var sbcountmax =13;
var sbcountmax = regsensorbuff.length;


//=== syspub function ===
function jobjcopy(jobj){
	return JSON.parse(JSON.stringify(jobj));	
}

function apipamcheck(res,cmd,uuid,pos,group,cstu,callback){
	console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	//if(typeof(group) == "undefined" )console.log("group Fail ...");
	if( (uuid != pdbuffer.setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined") || (typeof(cstu) == "undefined") ){
		let jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	let jobj = {  "success" : "true"  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	
	callback();
}

//===========================

//=========================================================
// local device command 
//=========================================================

//=========================================================
	
var cmdtab={
	"C71":"LED",
	"C72":"PUMP",
	"C73":"AIRFAN",
	"C74":"GROUP",
	"C75":"UV",
	"C76":"CO2",
	"C77":"TEMPERATURE",
	"C78":"RH",
	"C79":"WATERLEVEL",
	"C7A":"ELECTRONS",
	"C7B":"PH",
	"C7C":"PWM",
	"C7D":"SETTIME",
	"C7E":"AUTO"
}



//=========================================================
var sensorcmdtab={
	"C76":"CO2",
	"C77":"TEMPERATURE",
	"C78":"RH",
	"C79":"WATERLEVEL",
	"C7A":"ELECTRONS",
	"C7B":"PH"
}



// ==== opf403 container tree type REG channel device stu load and upload =====

function  opf403_regdev_apiloadscan(regpos){//poslist ,api call LOAD save to buffer load sensor value save to buffer  
	console.log("### sensor device load to PDDATA buffer ..."+JSON.stringify(regpos));
	let llpos={}
	if(regpos.length > 0){
		for(rr in regpos){
			if(!(regpos[rr].POS in pdbuffer.pdjobj.PDDATA.Devtab))continue;
			
			devloadurl = "http://127.0.0.1:3000/"+regpos[rr].CMD+"?UUID="+pdbuffer.setuuid+"&Action=LOAD"+"&POS="+regpos[rr].POS+"&STU="+regpos[rr].STU+"&GROUP=0000"
			client.get(devloadurl, function (data, response) {
				console.log("apiuel: load ok...");
			}).on("error", function(err) {console.log("err for client");});
		}
	}
}

function  opf403_regdev_loadscan(regpos){//poslist ,direct buffer LOAD save to buffer load sensor value save to buffer  
	console.log("### sensor device load to PDDATA buffer ..."+JSON.stringify(regpos));		
	let ttbuf = ""	
	let llpos={}
	let cregadd = 0x91;
	if(regpos.length > 0){
		for(rr in regpos){
			if(!(regpos[rr].POS in pdbuffer.pdjobj.PDDATA.Devtab))continue;//undefine pos is pass
			
			cregadd = regpos[rr].STU.substr(0,2)//[0][1] 2 byte
			ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
			ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[regpos[rr].POS].STATU.devadd;	
			ttbuf[4]= 0x02;//define for LOAD			
			ttbuf[5]= Number('0x'+cregadd);
			ttbuf[6]= 0x00;
			ttbuf[7]= 0x00;
			pdbuffer.totxbuff(ttbuf);
		}
	}
}

var regcmdtab={
	"AirRH":"C78",
	"AirTemp":"C77",
	"EC":"C7A",
	"WaterTemp":"C77",
	"WaterLevel":"C79",
	"CO2":"C76",
	"TEMPERATURE":"C77",
	"RH":"C78",
	"WATERLEVEL":"C79",
	"ELECTRONS":"C7A",
	"PH":"C7B"	
}

function opf403_regstulinkweb(regdevarr){
	console.log("### sensor link upload web DB..."+JSON.stringify(regdevarr));
	//[sensor位置回報]  http://tscloud.opcom.com/Cloud/API/v2/SensorStatus?
    //ID={UUID}& POS={POS}&  Type={AirTemp,AirRH,EC,PH,CO2,WaterTemp,WaterLevel}& value={value}	
	let jjpos={};
	let regcmdcode="";
	let cregadd = 0x91;
	let regval = 0;
	let outregval=0;
	if(regdevarr.length > 0){
		for(rr in regdevarr){
			if(!(regdevarr[rr].POS in pdbuffer.pdjobj.PDDATA.Devtab))continue;//undefine pos is pass
			jjpos=pdbuffer.pdjobj.PDDATA.Devtab[regdevarr[rr].POS];
			if(!(regdevarr[rr].CMD in regcmdtab ))continue;//undefine is pass			
			regcmdcode = regcmdtab[regdevarr[rr].CMD]
			if(!(regcmdcode in jjpos ))continue;//undefine is pass	
			cregadd = regdevarr[rr].STU.substr(0,2)//[0][1] 2 byte
			if(!(cregadd in jjpos[regcmdcode]["chtab"]))continue;//undefine is pass	
			regval = jjpos[regcmdcode]["chtab"][cregadd]["stu"]
			outregval=regval
			//if(regdevarr[rr].CMD=="RH")outregval=(regval/10)
			//if(regdevarr[rr].CMD=="TEMPERATURE")outregval=(regval/10)
			regsensor_url = pdbuffer.pdjobj.PDDATA.v2sensorstatusurl+"?ID="+pdbuffer.setuuid+"&POS="+regdevarr[rr].POS+"&Type="+regdevarr[rr].CMD+"&value="+outregval
			console.log(">>web "+regsensor_url);
			client.get(regsensor_url,cargs, function (data, response) {
				console.log("sensor uplaod url: load ok...");
			}).on("error", function(err) {console.log("err for client");}).on('requestTimeout', function (req) {req.abort();});
		}		
	}	
}


function opf403_regstulinkweb220(regdevarr){
	console.log("### sensor link upload web DB..."+JSON.stringify(regdevarr));
	//[sensor位置回報]  http://tscloud.opcom.com/Cloud/API/v2/SensorStatus?
    //ID={UUID}& POS={POS}&  Type={AirTemp,AirRH,EC,PH,CO2,WaterTemp,WaterLevel}& value={value}	
	let jjpos={};
	let regcmdcode="";
	let cregadd = 0x91;
	let regval = 0;
	if(regdevarr.length > 0){
		for(rr in regdevarr){
			if(!(regdevarr[rr].POS in pdbuffer.pdjobj.PDDATA.Devtab))continue;//undefine pos is pass
			jjpos=pdbuffer.pdjobj.PDDATA.Devtab[regdevarr[rr].POS];
			if(!(regdevarr[rr].CMD in regcmdtab ))continue;//undefine is pass			
			regcmdcode = regcmdtab[regdevarr[rr].CMD]
			if(!(regcmdcode in jjpos ))continue;//undefine is pass	
			cregadd = regdevarr[rr].STU.substr(0,2)//[0][1] 2 byte
			if(!(cregadd in jjpos[regcmdcode]["chtab"]))continue;//undefine is pass	
			regval = jjpos[regcmdcode]["chtab"][cregadd].stu
			regsensor_url = "http://192.168.5.220/API/v2/SensorStatus?"+"ID="+pdbuffer.setuuid+"&POS="+regdevarr[rr].POS+"&Type="+regdevarr[rr].CMD+"&value="+regval
			console.log(">>web "+regsensor_url);
			client.get(regsensor_url,cargs, function (data, response) {
				console.log("sensor uplaod url: load ok...");
			}).on("error", function(err) {console.log("err for client");}).on('requestTimeout', function (req) {req.abort();});
		}		
	}	
}

function opf402_regstulinkweb250(regdevarr){//for 402 is 250
	console.log("### sensor link upload web DB..."+JSON.stringify(regdevarr));
	//[sensor位置回報]  http://tscloud.opcom.com/Cloud/API/v2/SensorStatus?
    //ID={UUID}& POS={POS}&  Type={AirTemp,AirRH,EC,PH,CO2,WaterTemp,WaterLevel}& value={value}	
	let jjpos={};
	let regcmdcode="";
	let cregadd = 0x91;
	let regval = 0;
	if(regdevarr.length > 0){
		for(rr in regdevarr){
			if(!(regdevarr[rr].POS in pdbuffer.pdjobj.PDDATA.Devtab))continue;//undefine pos is pass
			jjpos=pdbuffer.pdjobj.PDDATA.Devtab[regdevarr[rr].POS];
			if(!(regdevarr[rr].CMD in regcmdtab ))continue;//undefine is pass			
			regcmdcode = regcmdtab[regdevarr[rr].CMD]
			if(!(regcmdcode in jjpos ))continue;//undefine is pass	
			cregadd = regdevarr[rr].STU.substr(0,2)//[0][1] 2 byte
			if(!(cregadd in jjpos[regcmdcode]["chtab"]))continue;//undefine is pass	
			regval = jjpos[regcmdcode]["chtab"][cregadd].stu
			regsensor_url = "http://192.168.5.250/API/v2/SensorStatus.php?"+"ID="+pdbuffer.setuuid+"&POS="+regdevarr[rr].POS+"&Type="+regdevarr[rr].CMD+"&value="+regval
			console.log(">>web "+regsensor_url);
			client.get(regsensor_url,cargs, function (data, response) {
				console.log("sensor uplaod url: load ok...");
			}).on("error", function(err) {console.log("err for client");}).on('requestTimeout', function (req) {req.abort();});
		}		
	}	
}


//=== /DeviceList return to Restful API ===
// app.get('/DeviceList', function (req, res) {	
	// event.on('devallscan_event', function() {		
		// function devalldatalink(){//###000,load		
			// function todevoutbuff(jdev)
				// event.on('senddevlist_event', function() { 
		
		
// app.get('/DeviceList', function (req, res) {	
	// event.on('devposload_event', function(spos) { //pos on	
		// function devposloaddata(spos){//pos , load
			// function todevoutbuff(jdev)
				// event.on('senddevlist_event', function() { 
//==========================================
var devoutbuff = [];//devloadurl 

function todevoutbuff(jdev){
	devoutbuff.push(JSON.stringify(jdev))	
	if(devoutbuff.length==1){			
		setTimeout(function(){event.emit('senddevlist_event')},10);	
	}
}

event.on('senddevlist_event', function() { 
	if(devoutbuff.length>0){	
	        sdev = devoutbuff.shift();
			console.log("type ="+typeof(sdev)+" data="+sdev);
			setdevouturl = devloadurl+"?success=true&UUID="+setuuid+"&result="+sdev;       
			console.log("url="+setdevouturl);
            client.get(setdevouturl, function (data, response) {}).on("error", function(err) {console.log("err for client");});
			setTimeout(function(){event.emit('senddevlist_event')},10);		
	}
});

function ondevlinkbuff(callback){//### check all devtab link status by pos 
	let jload = []
	jpos={"POSTab":"0000","GROUP":0,"Status":"0"}	
	//jdevout = { "UUID" : setuuid ,"devlist":jload} //
	//jload.push({"success":"true","UUID" : setuuid  });
	for(pos in pdbuffer.pdjobj.PDDATA.Devtab){				
		if(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK == 1){
			jpos.POSTab = pos;
			jpos.GROUP =  Number(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP)%10;
			if( typeof(jpos.GROUP) == 'object' )jpos.GROUP = 0;
			jpos.Status = pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK;
			//console.log("###1jpos = "+JSON.stringify(jpos));
			jload.push(jobjcopy(jpos));
		}
	}
	console.log("devlist="+JSON.stringify(jload));
	callback(jload)
	return
}

function ondevposbuff(spos,callback){//###	
	let jload = []
	if((spos in pdbuffer.pdjobj.PDDATA.Devtab)== false)callback(jload);
	//jpos={"POSTab":spos,"group":"0"}
	console.log("sop="+spos)
	jdev={"CMD":0,"sub":0,"stu":0,"Data":0,"chtab":0};
	for(scmd in  pdbuffer.pdjobj.PDDATA.Devtab[spos]){
		if(scmd != "STATU"){			
			vkey = cmdcode.apicmdtype[scmd]
			jdev.CMD = vkey
			jdev.sub = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].sub
			jdev.stu = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].stu
			jdev.Data = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].Data
			jdev.chtab = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].chtab
			//console.log("key="+vkey)
			//console.log("data="+ pdjobj.PDDATA.Devtab[spos][scmd].sub)
			jload.push(jobjcopy(jdev));
		}
	}
	callback(jload);
	return
}

function devalldatalink(){//###000,load
	let jload = []
	jpos={"POSTab":"0000","GROUP":0,"Status":0}	
	//jdevout = { "UUID" : setuuid ,"devlist":jload} //
	//jload.push({"success":"true","UUID" : setuuid  });
	for(pos in pdbuffer.pdjobj.PDDATA.Devtab){				
		if(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK == 1){
			jpos.POSTab = pos;
			jpos.GROUP =  Number(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP)%10;
			if( typeof(jpos.GROUP) == 'object' )jpos.GROUP = 0;
			jpos.Status = pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK;
			//console.log("###2jpos = "+JSON.stringify(jpos)+"##"+jpos.GROUP);			
			jload.push(jobjcopy(jpos));
		}
	}
	console.log("devlist="+JSON.stringify(jload));
	todevoutbuff(jload);//link to device report Restfulapi		
}

event.on('devallscan_event', function() { 
	devalldatalink();
});

function devposloaddata(spos){//pos , load
	if((spos in pdbuffer.pdjobj.PDDATA.Devtab)== false)return
	let jload = []
	//jpos={"POSTab":spos,"group":"0"}
	console.log("sop="+spos)
	jdev={"CMD":0,"sub":0,"stu":0,"Data":0}
	for(scmd in  pdbuffer.pdjobj.PDDATA.Devtab[spos]){
		if(scmd != "STATU"){			
			vkey = cmdcode.apicmdtype[scmd]
			jdev.CMD = vkey
			jdev.sub = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].sub
			jdev.stu = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].stu
			jdev.Data = pdbuffer.pdjobj.PDDATA.Devtab[spos][scmd].Data
			//console.log("key="+vkey)
			//console.log("data="+ pdjobj.PDDATA.Devtab[spos][scmd].sub)
			jload.push(jobjcopy(jdev));
		}
	}
	
	jpos={"POSTab":"0000","GROUP":0,"Status":0,"result":0}	
	jpos.GROUP =  Number(pdbuffer.pdjobj.PDDATA.Devtab[spos].STATU.GROUP);
	jpos.POSTab = spos
	jpos.Status = pdbuffer.pdjobj.PDDATA.Devtab[spos].STATU.LINK;
	jpos.result = jload
	todevoutbuff(jpos);		
}

event.on('devposload_event', function(spos) { //pos on
	devposloaddata(spos);
});


//=== web sever Route ==================
// WEB COMMAMD LIST
//======================================
app.get('/', function (req, res) {
	//console.log(req.body)
	console.log(req.query.pin);
	res.send('Hello World!')
});

//===============================================
//System API Command 
//===============================================
app.get('/connectcheck', function (req, res) {
    //console.log(req.body)
    console.log(req.query.pin);
    res.send("ready");		
	//ct = devlinkscan(1);//1:cube device 2:linkbox
});


app.get('/loadcheck', function (req, res) {  //sensor device load scan to PDDATA buffer test
    console.log(req.query.pin);
    res.send("ready");
	
	
	autocmd.autoeventcall('sensorcheck_event'); //cechk auto scan 	
	autocmd.autoeventcall('alarmcheck_event'); //cechk alarm scan 
	
	sbcount++;
	if(sbcount>=sbcountmax)sbcount=0;		
	opf403_regdev_loadscan(regsensorbuff[sbcount]);
	
});

app.get('/typecheck', function (req, res) { //sensor PDDATA buffer upload to web DB test ! 
    res.send("ready web typwchk");		
	console.log(">>LOCAL server 192.268.5.220 Link Mode !");	
	sbcount++;
	if(sbcount>=sbcountmax)sbcount=0;				
	opf403_regstulinkweb(regsensorbuff[sbcount]);
	opf402_regstulinkweb250(regsensorbuff[sbcount]);//up to local server 
	
	
});

app.get('/fwupdate_start', function (req, res) { //sensor PDDATA buffer upload to web DB test ! 
    res.send("ready fw update link start up!");			
	exec(start_cmdStr, function(){
		console.log("restart link C922 v8022 ... ")
	});
	
});

app.get('/fwupdate_stop', function (req, res) { //sensor PDDATA buffer upload to web DB test ! 
    res.send("ready fw update link stop !");		
	exec(stop_cmdStr, function(){
		console.log("stop link C922 v8022 ... ")
	});
	
	
});

app.get('/PDINFO', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = req.query.GROUP
	let cstu = req.query.STU	
	console.log("API cmd ="+cmd+" uuid="+uuid+" pos="+pos+" group="+group);
	//if(typeof(group) == "undefined" )console.log("group Fail ...");
	if((typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined") || (typeof(cstu) == "undefined") ){		
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	if((uuid != setuuid) && (uuid != "OPFARM0921836780")){
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}	
	//=== pdinfo command =================
	jobj = {  "success" : "true"  }; 
	console.log(JSON.stringify(jobj));
	if(group in pdbuffer.pdjobj.PDDATA ){
		if(group == "Devtab" ){		
			let posarr=pos.split(":");
			let poslength = posarr.length;
			let ssarry = cstu.split('\\');
			let cstu2 = ""
			for (c in ssarry){
				cstu2 = cstu2 + ssarry[c];
			}
			console.log("stu ="+cstu2);
			let jstu = JSON.parse(cstu2);
			switch(cmd){
				case "ON":
					//update to File
					pdbuffer.sysupdate(function(){
						if(error){ //如果有錯誤，把訊息顯示並離開程式
							console.log('PDDATA.txt update ERR ! ');							
							jobj = { "success" : "false" };  
						}else{
							console.log('PDDATA.txt update OK ! ');
							jobj = {  "success" : "true"  }; 							
						}
					});
					break
				case "LOAD":
					if(poslength == 2){						
						jstu = pdbuffer.pdjobj.PDDATA.Devtab[posarr[0]][posarr[1]];
					}else{	
						console.log("devkey ="+posarr[0]);					
						jstu = pdbuffer.pdjobj.PDDATA.Devtab[posarr[0]];
					}
					jobj.GROUP =  group;
					jobj.STU = jstu
					jobj.UUID= uuid
					jobj.POS= pos
					jobj.Action="LOAD"
					break	
				case "SET":
					if(poslength == 2){		
						pdbuffer.pdjobj.PDDATA.Devtab[posarr[0]][posarr[1]] = jstu;
					}
					if(poslength == 1){							
						pdbuffer.pdjobj.PDDATA.Devtab[posarr[0]] = jstu;
					}
					jobj.GROUP =  group;
					jobj.STU = jstu
					jobj.UUID= uuid
					jobj.POS= pos
					jobj.Action="SET"
					break
				default:
					return 		
			}				
		}else{	
			switch(cmd){
				case "ON":
					//update to File
					pdbuffer.sysupdate(function(){
						if(error){ //如果有錯誤，把訊息顯示並離開程式
							console.log('PDDATA.txt update ERR ! ');							
							jobj = { "success" : "false" };  
						}else{
							console.log('PDDATA.txt update OK ! ');
							jobj = {  "success" : "true"  }; 							
						}
					});
					break
				case "LOAD":
					cstu = pdbuffer.pdjobj.PDDATA[group];
					jobj.GROUP =  group;
					jobj.STU = cstu
					jobj.UUID= uuid
					jobj.POS= pos
					jobj.Action="LOAD"
					break	
				case "SET":
					pdbuffer.pdjobj.PDDATA[group]= cstu;
					ddsnurl = pdbuffer.pdjobj.PDDATA.dsnurl;
					vdsnurl = pdbuffer.pdjobj.PDDATA.videodsnurl;
					devloadurl =  pdbuffer.pdjobj.PDDATA.devloadurl;
					setuuid =  pdbuffer.pdjobj.PDDATA.UUID;
					
					jobj.GROUP =  group;
					jobj.STU = cstu
					jobj.UUID= uuid
					jobj.POS= pos
					jobj.Action="SET"
					break
				default:
					return 		
			}
		}
	}else if(group == "addposmap" ){
		switch(cmd){
			case "ON":
				//update to File 
				pdbuffer.sysupdate(function(){
					if(error){ //如果有錯誤，把訊息顯示並離開程式
						console.log('PDDATA.txt update ERR ! ');							
						jobj = { "success" : "false" };  
					}else{
						console.log('PDDATA.txt update OK ! ');
						jobj = {  "success" : "true"  }; 							
					}
				});
				break
			case "LOAD":
				if(pos=="00"){
					cstu = pdbuffer.pdjobj.addposmap
				}else{					
					cstu = pdbuffer.pdjobj.addposmap[pos];
				}
				jobj.GROUP =  group;
				jobj.STU = cstu
				jobj.UUID= uuid
				jobj.POS= pos
				jobj.Action="LOAD"
				break	
			case "SET":
				if(pos=="00"){
					pdbuffer.pdjobj.addposmap = JSON.parse(cstu);
				}else{					
					pdbuffer.pdjobj.addposmap[pos] = cstu;
				}						
				jobj.GROUP =  group;
				jobj.STU = cstu
				jobj.UUID= uuid
				jobj.POS= pos
				jobj.Action="SET"
				break
			default:
				return 		
		}
	}else{
		jobj = { "success" : "false" };  
		console.log("PDDATA JSON KEY Value Fail !");
		res.json(jobj);
		return;
	}
   
	res.json(jobj);
});

//===============================================
// DEVTAB Drive API Command 
//===============================================

//===============================================
// OFP403 TREE NET API Command  after /TREE/cmd ()
//===============================================
app.use('/TREE', treeRoutes);

//===============================================
// OFP403 REG API Command  after /REGCMD/cmd (LED,PUMP,AIRFAN,PH,ELECTRONS,RH)
//===============================================
app.use('/REGCMD', regcmdRoutes);




app.get('/LED', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = req.query.STU
	
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s71cmd
		//console.log("3>>"+group)
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		//console.log("4>>"+group)
		let funcode  = cmdcode.R485CMDDATA.LED[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		//console.log("5>>"+group)
		
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		if(group==0){
			//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
			if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
			//console.log("6>>"+group)
			
			//dev active
			if(cregadd == "20"){
				ttbuf = Buffer.from(cmdcode.rs485v050.sb0ledcmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
				cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
				ttbuf[4]= cmdindex;
				ttbuf[5]= Number('0x'+cregadd);//reg = 0x20
				ttbuf[6]=  Number('0x'+cstu.substr(2,2))//[2][3] 2 byte; pwmx1
				ttbuf[7]=  Number('0x'+cstu.substr(4,2))//[4][5] 2 byte;
				if(cstu.length < 7){
					ttbuf[8]=  Number('0x'+cstu.substr(2,2))//[2][3] 2 byte; pwmx1
					ttbuf[9]=  Number('0x'+cstu.substr(4,2))//[4][5] 2 byte;
					
					ttbuf[10]=  Number('0x'+cstu.substr(2,2))//[2][3] 2 byte; pwmx1
					ttbuf[11]=  Number('0x'+cstu.substr(4,2))//[4][5] 2 byte;					
				}else{
					ttbuf[8]=  Number('0x'+cstu.substr(6,2))//[6][7] 2 byte; pwmx2
					ttbuf[9]=  Number('0x'+cstu.substr(8,2))//[8][9] 2 byte;
					
					ttbuf[10]=  Number('0x'+cstu.substr(10,2))//[10][11] 2 byte;pwmx3
					ttbuf[11]=  Number('0x'+cstu.substr(12,2))//[12][13] 2 byte;					
				}
				
			}else{//channel 0x021,0x22,0x23,0x24
				ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
				cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
				ttbuf[4]= cmdindex;
				ttbuf[5]= Number('0x'+cregadd);//0x21,0x22,0x23
				ttbuf[6]= nstu>>8;
				ttbuf[7]= nstu&0x00ff;
			}
			
			if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
			   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
			}else{
			   return;
			}
			//ttbuf[8]= group>>8;
			//ttbuf[9]= group&0x00ff;
			
			switch(cmd){
				case "OFF":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];	
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=cstu;				
					break
				case "ON":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];	
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=cstu;			
					break
				case "LOAD":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
					break	
				default:
					return 		
			}
		}else if(group < 0xf0 ){
			//console.log("1>>"+group)
			if(cregadd == "20"){
				ttbuf = Buffer.from(cmdcode.rs485v050.sb0gledcmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
					
				cmdindex = pdbuffer.pdjobj.subcmd[cmd]
				pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
				pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=cstu;					
				ttbuf[4]= cmdindex;
				
					
				ttbuf[5]= Number('0x'+cregadd);//0x20
				
				ttbuf[6]=  Number('0x'+cstu.substr(2,2))//[2][3] 2 byte; pwmx1
				ttbuf[7]=  Number('0x'+cstu.substr(4,2))//[4][5] 2 byte;
				
				if(cstu.length < 7){
					ttbuf[8]=  Number('0x'+cstu.substr(2,2))//[2][3] 2 byte; pwmx1
					ttbuf[9]=  Number('0x'+cstu.substr(4,2))//[4][5] 2 byte;
					
					ttbuf[10]=  Number('0x'+cstu.substr(2,2))//[2][3] 2 byte; pwmx1
					ttbuf[11]=  Number('0x'+cstu.substr(4,2))//[4][5] 2 byte;					
				}else{
					ttbuf[8]=  Number('0x'+cstu.substr(6,2))//[6][7] 2 byte; pwmx2
					ttbuf[9]=  Number('0x'+cstu.substr(8,2))//[8][9] 2 byte;
					
					ttbuf[10]=  Number('0x'+cstu.substr(10,2))//[10][11] 2 byte;pwmx3
					ttbuf[11]=  Number('0x'+cstu.substr(12,2))//[12][13] 2 byte;					
				}
				
				ttbuf[12]= group>>8;
				ttbuf[13]= group&0x00ff;
				
			}else{
				ttbuf = Buffer.from(cmdcode.rs485v050.sb0gcmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
					
				cmdindex = pdbuffer.pdjobj.subcmd[cmd]	
				pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
				pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=cstu;			
				ttbuf[4]= cmdindex;
				
				ttbuf[5]= Number('0x'+cregadd);//0x21,0x22,0x23
				
				ttbuf[6]= nstu>>8;
				ttbuf[7]= nstu&0x00ff;
				
				ttbuf[8]= group>>8;
				ttbuf[9]= group&0x00ff;
			}
		}else{
			//group is err
			//console.log("2>>"+group)
			return;
		}
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
	//res.send('Hello LED!')
});




//=======================================================
app.get('/PUMP', function (req, res) {
  console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = req.query.STU
	
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s72cmd
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.PUMP[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		if(group==0){
			//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
			if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
			//dev active
			ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
			if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
			   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
			}else{
			   return;
			}
			
			cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
			ttbuf[4]= cmdindex;
			ttbuf[5]= Number('0x'+cregadd);
			ttbuf[6]= nstu>>8;
			ttbuf[7]= nstu&0x00ff;
			//ttbuf[8]= group>>8;
			//ttbuf[9]= group&0x00ff;
			
			switch(cmd){
				case "OFF":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];	
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=nstu;	
			console.log("PUMP >>1>"+cmd);			
					break
				case "ON":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];	
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=nstu;	
			console.log("PUMP >>2>"+cmd);		
					break
				case "LOAD":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
					break	
				default:
					return 		
			}
		}else if(group <0xf0 ){
			ttbuf = Buffer.from(cmdcode.rs485v050.sb0gcmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
			
			cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
			ttbuf[4]= cmdindex;
			ttbuf[5]= Number('0x'+cregadd);
			ttbuf[6]= nstu>>8;
			ttbuf[7]= nstu&0x00ff;
			ttbuf[8]= group>>8;
			ttbuf[9]= group&0x00ff;
			console.log("PUMP >>3>"+cmd);
		}else{
		   //group is err
			return;
		}
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
	
  //res.send('Hello pump!')
});

//=====================================================
app.get('/AIRFAN', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = String(req.query.STU) 

	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s72cmd
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.AIRFAN[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		if(group==0){
			//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
			if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
			//dev active
			ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
			if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
			   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
			}else{
			   return;
			}
			
			cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
			ttbuf[4]= cmdindex;
			ttbuf[5]= Number('0x'+cregadd);
			ttbuf[6]= nstu>>8;
			ttbuf[7]= nstu&0x00ff;
			//ttbuf[8]= group>>8;
			//ttbuf[9]= group&0x00ff;
			
			switch(cmd){
				case "OFF":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];	
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=nstu;				
					break
				case "ON":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];	
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=nstu;			
					break
				case "LOAD":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
					break	
				default:
					return 		
			}
		}else if(group <0xf0 ){
			ttbuf = Buffer.from(cmdcode.rs485v050.sb0gcmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
			
			cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
			ttbuf[4]= cmdindex;
			ttbuf[5]= Number('0x'+cregadd);
			ttbuf[6]= nstu>>8;
			ttbuf[7]= nstu&0x00ff;
			ttbuf[8]= group>>8;
			ttbuf[9]= group&0x00ff;
			
		}else{
		   //group is err
			return;
		}
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
   
})
//=====================================================
app.get('/GROUP', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = String(req.query.STU) 
  
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s72cmd
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.GROUP[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		
		//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		if(group==0){
			//dev active
			ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
			if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
			   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
			}else{
			   return;
			}
			
			cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
			ttbuf[4]= cmdindex;
			ttbuf[5]= Number('0x'+cregadd);
			ttbuf[6]= nstu>>8;
			ttbuf[7]= nstu&0x00ff;
			//ttbuf[8]= group>>8;
			//ttbuf[9]= group&0x00ff;
			
			switch(cmd){
				case "LOAD":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];		
					break
				case "SET":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];	
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=nstu;			
					break
				default:
					return 		
			}
		}else {
		   //group is err
			return;
		}
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
	
   //==================================
   //set2dev(ttbuf);	
   //pdbuffer.totxbuff(ttbuf);
})

//=====================================================
app.get('/UV', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = req.query.STU
	
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s72cmd
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.PUMP[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
			
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		if(group==0){
			//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
			if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
			//dev active
			ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
			if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
			   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
			}else{
			   return;
			}
			
			cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
			ttbuf[4]= cmdindex;
			ttbuf[5]= Number('0x'+cregadd);
			ttbuf[6]= nstu>>8;
			ttbuf[7]= nstu&0x00ff;
			//ttbuf[8]= group>>8;
			//ttbuf[9]= group&0x00ff;
			
			switch(cmd){
				case "OFF":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];	
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=nstu;				
					break
				case "ON":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];	
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].sub=cmdindex;		
					pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"][cregadd].stu=nstu;			
					break
				case "LOAD":
					ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
					break	
				default:
					return 		
			}
		}else if(group <0xf0 ){
			ttbuf = Buffer.from(cmdcode.rs485v050.sb0gcmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
			
			let cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
			ttbuf[4]= cmdindex;
			ttbuf[5]= Number('0x'+cregadd);
			ttbuf[6]= nstu>>8;
			ttbuf[7]= nstu&0x00ff;
			ttbuf[8]= group>>8;
			ttbuf[9]= group&0x00ff;
			
		}else{
		   //group is err
			return;
		}
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
	
  //res.send('Hello pump!')
	
	
});

//=====================================================
app.get('/CO2', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = req.query.STU
	
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s72cmd
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.CO2[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		
		//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{
		   return;
		}
		
		cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
		ttbuf[4]= cmdindex;
		ttbuf[5]= Number('0x'+cregadd);
		ttbuf[6]= nstu>>8;
		ttbuf[7]= nstu&0x00ff;
		//ttbuf[8]= group>>8;
		//ttbuf[9]= group&0x00ff;
		
		switch(cmd){
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			default:
				return 		
		}
			
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
	
  //res.send('Hello pump!')
	
   
   
})

//=====================================================
app.get('/TEMPERATURE', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = String(req.query.STU) // add the airfan 2ch control 
	
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s72cmd
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.TEMPERATURE[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		
		//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{
		   return;
		}
		
		cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
		ttbuf[4]= cmdindex;
		ttbuf[5]= Number('0x'+cregadd);
		ttbuf[6]= nstu>>8;
		ttbuf[7]= nstu&0x00ff;
		//ttbuf[8]= group>>8;
		//ttbuf[9]= group&0x00ff;
		
		switch(cmd){
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			default:
				return 		
		}
			
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
	
  //res.send('Hello pump!')
	
})
//=====================================================
app.get('/RH', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = String(req.query.STU) // add the airfan 2ch control 
	
	
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s72cmd
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.RH[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		
		//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{
		   return;
		}
		
		cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
		ttbuf[4]= cmdindex;
		ttbuf[5]= Number('0x'+cregadd);
		ttbuf[6]= nstu>>8;
		ttbuf[7]= nstu&0x00ff;
		//ttbuf[8]= group>>8;
		//ttbuf[9]= group&0x00ff;
		
		switch(cmd){
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			default:
				return 		
		}
			
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
   
});
//=====================================================
app.get('/WATERLEVEL', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = String(req.query.STU) 
  
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s72cmd
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.WATERLEVEL[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		
		//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{
		   return;
		}
		
		cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
		ttbuf[4]= cmdindex;
		ttbuf[5]= Number('0x'+cregadd);
		ttbuf[6]= nstu>>8;
		ttbuf[7]= nstu&0x00ff;
		//ttbuf[8]= group>>8;
		//ttbuf[9]= group&0x00ff;
		
		switch(cmd){
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			default:
				return 		
		}
			
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
  

});
//=====================================================
app.get('/ELECTRONS', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = String(req.query.STU) // add the airfan 2ch control 
  
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s72cmd
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.ELECTRONS[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		
		//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{
		   return;
		}
		
		cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
		ttbuf[4]= cmdindex;
		ttbuf[5]= Number('0x'+cregadd);
		ttbuf[6]= nstu>>8;
		ttbuf[7]= nstu&0x00ff;
		//ttbuf[8]= group>>8;
		//ttbuf[9]= group&0x00ff;
		
		switch(cmd){
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			default:
				return 		
		}
			
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
   
})
//=====================================================
app.get('/PH', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = String(req.query.STU) 
  
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{		
		//scmd = rs485v040.s72cmd
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.PH[0];
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		
		//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		
		//dev active
		ttbuf = Buffer.from(cmdcode.rs485v050.sb0cmd,'hex'); //"[0][1:add][2:len][3][4:cmd][5:REG][6,7:stu][8,9:groud][10]"f5 00 06 00 02 20 12 34 12 34 20"
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{
		   return;
		}
		
		cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
		ttbuf[4]= cmdindex;
		ttbuf[5]= Number('0x'+cregadd);
		ttbuf[6]= nstu>>8;
		ttbuf[7]= nstu&0x00ff;
		//ttbuf[8]= group>>8;
		//ttbuf[9]= group&0x00ff;
		
		switch(cmd){
			case "LOAD":
				ttbuf[4]=pdbuffer.pdjobj.subcmd[cmd];
				break	
			default:
				return 		
		}
			
		//========================================
		//set2dev(ttbuf);
		pdbuffer.totxbuff(ttbuf);
	});	
   
   
})
//=====================================================
app.get('/DeviceList', function (req, res) {
  console.log(req.query);	
  let cmd = req.query.Action
  let uuid = req.query.UUID
  let pos = req.query.POS
  let group = Number('0x'+req.query.GROUP)
  if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") ){
	jobj = { "success" : "false" };  
	console.log(JSON.stringify(jobj));
	res.json(jobj);
	return;
  }
  jobj = {  "success" : "true" , "UUID" : uuid  }; 
  console.log(JSON.stringify(jobj));
  if(cmd != "ON")res.json(jobj);
  
   //==================================   
   let ttbuf = Buffer.from(cmdcode.rs485v040.ackcmd,'hex');
   if(pos == "0000"){
		if(cmd == "LOAD"){		  
			return; //Container no Load 0x70 for POS link stutas
			// ct = devlinkscan(3);//1:cube device 2:linkbox 3:Container
			// setTimeout(function() { 
				// event.emit('devallscan_event'); 
			// }, ct * 1520);		
		}else{		   
			//devalldatalink();
			j3obj={}
			j3obj.success="true"
			j3obj.UUID=setuuid;
			ondevlinkbuff(function(jj){
				j3obj.result = jj
				res.json(j3obj);
			});			
			return;
		}
   }else if(pos in pdbuffer.pdjobj.PDDATA.Devtab ){
		//if(pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK == 1){	
			if(cmd == "LOAD"){			
				return;	   
				//ct = devloadscan(pos);			
				//setTimeout(function() { 
				//	event.emit('devposload_event',(pos)); 
				//}, ct * 1520);//#### delay wait 	
			}else{//=="ON"
				//devposloaddata(pos);
				j3obj={}
				j3obj.success="true";
				j3obj.UUID=setuuid;		
				j3obj.POSTab = pos;
				//j3obj.GROUP=pdbuffer.pdjobj.PDDATA.Devtab[pos].C74.stu;
				j3obj.GROUP=pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.GROUP;
				j3obj.Status=pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK;
				ondevposbuff(pos,function(jj){		
					j3obj.result = jj;
					res.json(j3obj);
				});				
				return;
			}
		//}else{	
		//	console.log("no link="+pos+"#"+pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.LINK)
		//	if(cmd == "ON")res.json(jobj);
		//	return;			
		//}
   }else{
		if(cmd == "ON")res.json(jobj);		
		return	   
   }
   //set2dev(ttbuf);
})

//=====================================================
app.get('/PWM', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = String(req.query.STU) // add the airfan 2ch control 
	
	apipamcheck(res,cmd,uuid,pos,group,cstu,()=>{			
		//scmd = rs485v040.s72cmd
		//console.log("1>>"+cmd);
		let cmdindex=0
		if(!(cmd in pdbuffer.pdjobj.subcmd))return;
		let funcode  = cmdcode.R485CMDDATA.PWM[0];
		//console.log("2>>"+cmd+">>"+funcode+">>"+pos);
		if(!(funcode in pdbuffer.pdjobj.PDDATA.Devtab[pos]))return;
		
		//cmdindex = pdbuffer.pdjobj.subcmd[cmd];
		let cregadd = cstu.substr(0,2)//[0][1] 2 byte
		//console.log("3>>"+cmd+">>"+funcode+">>"+pos+">>"+cregadd);
		if(!(cregadd in pdbuffer.pdjobj.PDDATA.Devtab[pos][funcode]["chtab"]))return;
		
		let	nstu = Number('0x'+cstu.substr(2,4))//[2][3][4][5] 4 byte
		let ttbuf = ""
		ttbuf = Buffer.from(cmdcode.rs485v050.s1fcmd,'hex');		
		if(pos in pdbuffer.pdjobj.PDDATA.Devtab){ //check pos is working
		   ttbuf[1]= pdbuffer.pdjobj.PDDATA.Devtab[pos].STATU.devadd;
		}else{
		   return;
		}
		//F5 F1 08 00 00 40 00 00 00 group check tx: f5 f1 08 00 00 00 00 00 00 ff 20
		// 0  1  2  3  4  5  6  7  8                  0  1  2  3  4  5  6  7  8  9  10
		console.log("4>>"+cmd);
		switch(cmd){
			case "OFF":
				cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
				ttbuf[4]= cmdindex;
				ttbuf[1]= 0xf1  //brocat command 
				ttbuf[5]= 0x40  //control reg
				ttbuf[6]= nstu>>8;
				ttbuf[7]= nstu&0x00ff;
				ttbuf[8]= group>>8;
				ttbuf[9]= group&0x00ff;
				
				break	
			case "ON":
				cmdindex = pdbuffer.pdjobj.subcmd[cmd]			
				ttbuf[4]= cmdindex;
				ttbuf[1]= 0xf1  //brocat command 
				ttbuf[5]= 0x40  //control reg 
				ttbuf[6]= nstu>>8;
				ttbuf[7]= nstu&0x00ff;
				ttbuf[8]= group>>8;
				ttbuf[9]= group&0x00ff;
				break	
			default:
				return 		
		}
		
		console.log("5>>"+cmd);
		pdbuffer.totxbuff(ttbuf);
		
	});	
});

//=====================================================
app.get('/SETTIME', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
	let cstu = req.query.STU
	
	if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	jobj = {  "success" : "true" , "UUID" : uuid  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);


	
})


//=====================================================
app.get('/AUTO', function (req, res) {
	console.log(req.query);	
	let cmd = req.query.Action
	let uuid = req.query.UUID
	let pos = req.query.POS
	let group = Number('0x'+req.query.GROUP)
    let cstu = req.query.STU
	
	if( (uuid != setuuid) || (typeof(cmd) == "undefined") || (typeof(pos) == "undefined") || (typeof(group) == "undefined")  ){
		jobj = { "success" : "false" };  
		console.log(JSON.stringify(jobj));
		res.json(jobj);
		return;
	}
	jobj = {  "success" : "true" , "UUID" : uuid  }; 
	console.log(JSON.stringify(jobj));
	res.json(jobj);

})


//=====================================================
//Linke gateway Start UP and login DDNS
//=====================================================
app.listen(setport, function () {    
	
	pdbuffer.sysload(function(){
		ddsnurl = pdbuffer.pdjobj.PDDATA.dsnurl;
		vdsnurl = pdbuffer.pdjobj.PDDATA.videodsnurl;
		devloadurl =  pdbuffer.pdjobj.PDDATA.devloadurl;		
		typeloadurl = pdbuffer.pdjobj.PDDATA.typeloadurl;

		setuuid =  pdbuffer.pdjobj.PDDATA.UUID;

		console.log("uuids = ", setuuid);
		console.log("dsnurl = ", ddsnurl);
		console.log("videodsnurl = ",vdsnurl);//devloadur
		console.log("devloadur = ", devloadurl)

		//res.send(req.query.appfile + ' ' + req.query.index);
		//res.send(webstr); 
		
		//### fa auto callback message event ###
		setInterval(function(){			
			//console.log("0xfc command check 0..."+global.arxokflag)
			//console.log("0xfc command check 0..."+global.arxokflag)
			if(global.arxokflag == true){
				console.log("0xfc command check 1..."+global.arxokflag)
				pdbuffer.eventcall('arxbuff_event'); 
				//global.arxokflag=false;
				global.arxokflag=false;
			}
		},150);

		//### user callback message event ###
		setInterval(function(){			
			//console.log("0xfc command check 2..."+global.rxokflag)
			//console.log("0xfc command check 2..."+global.rxokflag)
			if(global.rxokflag == true){
				console.log("0xfc command check 3..."+global.rxokflag)
				pdbuffer.eventcall('rxbuff_event'); 
				//global.rxokflag=false;
				global.rxokflag=false;
			}
		},160);

		
		//### user callback message event ###
		setInterval(function(){			
			console.log("auto command check 2...");
			autocmd.autoeventcall('sensorcheck_event'); 
		},1 * 60 * 1000);		
		
		//### user callback message event ###
		setInterval(function(){			
			console.log("alarm message check 4...");
			autocmd.autoeventcall('alarmcheck_event'); //cechk auto scan 
		},3 * 60 * 1000);		
		
		
		if(pdbuffer.pdjobj.PDDATA.linkoffmode == 0){//ext web mode
			ngrok.connect(setport,function (err, url) {
				seturl = url
				chkurl = seturl+"/connectcheck"
				console.log("link=>"+seturl)
				setddsnurl = ddsnurl+'?DeviceIP='+seturl+'&UUID='+setuuid
				client.get(setddsnurl, function (data, response) {
					// parsed response body as js object
					console.log("get ok...") 
					//console.log(data.toString());
					//raw response 
					//console.log(response.query);
					setInterval(function(){
					  //console.log('test link ...');
						//chkurl = seturl+"/connectcheck"
						client.get(chkurl, function (data, response) {                        
							//console.log("linkchk ...")                        
							//console.log(data.toString());
							let chkstr = data.toString();
							if(chkstr === "ready"){                       
								console.log("linkchk ok ...",linkchkcount)
								linkchkcount=0;
								
								
								//container_stulinkweb(sensorbuff[sbcount]);//#### link load sensor data 
								//for(ii in sensorbuff[sbcount])typeloadlinkweb(sensorbuff[sbcount][ii]);
												
								sbcount++;
								if(sbcount>=sbcountmax)sbcount=0;	
								opf403_regdev_loadscan(regsensorbuff[sbcount]);//opf402 use reg level load scan 
								opf403_regstulinkweb(regsensorbuff[sbcount]);				
								opf402_regstulinkweb250(regsensorbuff[sbcount]);//up to local server 
								
								
							} else {							                       
								console.log("linkchk fail ...",linkchkcount) 
								linkchkcount++;
								//relink DDNS for ngrok 
								if(((typeof seturl) == "undefined" ) || (linkchkcount >=3) ){
									console.log("get x11...") 
									reload105ddsn();
								}				
							}
							
						}).on("error", function(err) {
							console.log("err for client");
							console.log("linkchk fail ...",linkchkcount) 
							linkchkcount++;
							//relink DDNS for ngrok 
							if(((typeof seturl) == "undefined" ) || (linkchkcount >=3) ){
								console.log("get x11...") 
								reload116ddsn();
							}		
							
						}).on('requestTimeout', function (req) {req.abort();});
					}, 4 * 60 * 1000);
				}).on("error", function(err) {console.log("err for client");});
			});
		}else if(pdbuffer.pdjobj.PDDATA.linkoffmode == 1){//off link mode
			console.log(">>OFF Link Mode !");
			setInterval(function(){				
				console.log(">>LOCAL OFF Link Mode !");
				
				//device_stulinkweb(sensorbuff[sbcount]);
				//for(ii in sensorbuff[sbcount])typeloadlinkweb(sensorbuff[sbcount][ii]);
				
				sbcount++;
				if(sbcount>=sbcountmax)sbcount=0;	
				opf403_regdev_loadscan(regsensorbuff[sbcount]);						
				opf402_regstulinkweb250(regsensorbuff[sbcount]);			
				
				
				//for(pp in sensorbuff[sbcount])devloadscan(sensorbuff[sbcount][pp]);	//load pos data to buffer 5min					
			}, 3 * 60 * 1000);
			
		}else if(pdbuffer.pdjobj.PDDATA.linkoffmode == 2){//by 220 mode
			console.log(">>LOCAL server 192.268.5.220 Link Mode !");
			setInterval(function(){				
				console.log(">>LOCAL server 192.268.5.220 Link Mode !");
				//#### link load sensor data 
				//container_stulinkweb(sensorbuff[sbcount]);//#### link load sensor data 
				//for(ii in sensorbuff[sbcount])typeloadlinkweb(sensorbuff[sbcount][ii]);
				
				sbcount++;
				if(sbcount>=sbcountmax)sbcount=0;	
				opf403_regdev_loadscan(regsensorbuff[sbcount]);					
				//opf403_regstulinkweb220(regsensorbuff[sbcount]);					
				opf402_regstulinkweb250(regsensorbuff[sbcount]);	
				
				//### sensor data buffer upload to web server 	
				//for(pp in sensorbuff[sbcount])devloadscan(sensorbuff[sbcount][pp]);	//load pos data to buffer 5min	
			}, 3 * 60 * 1000);			
			
		}
		console.log('Example app listening on port 3000!');		
		//power on start command 
		autocmd.active_keypadjob('KEYPAD0','K001','ON');//POWER KEY ON
	});
	 

});


function reload75ddsn(){	
    console.log('recall ngrok ...');
	ngrok.connect('192.168.5.75:3000',function (err, url) {
		seturl = url
        chkurl = seturl+"/connectcheck"
		console.log("link linkbox75C=>"+seturl);
        setddsnurl = ddsnurl+'?DeviceIP='+seturl+'&UUID='+setuuid
		client.get(setddsnurl, function (data, response) {
			console.log("get ok...") 				
		}).on("error", function(err) {console.log("err for client");});		
	});
}

function reload85ddsn(){	
    console.log('recall ngrok ...');
	ngrok.connect('192.168.5.85:3000',function (err, url) {
		seturl = url
        chkurl = seturl+"/connectcheck"
		console.log("link Cube85C=>"+seturl);
        setddsnurl = ddsnurl+'?DeviceIP='+seturl+'&UUID='+setuuid
		client.get(setddsnurl, function (data, response) {
			console.log("get ok...") 				
		}).on("error", function(err) {console.log("err for client");});		
	});
}

function reload116ddsn(){	
    console.log('recall ngrok ...');
	ngrok.connect('192.168.5.116:3000',function (err, url) {
		seturl = url
        chkurl = seturl+"/connectcheck"
		console.log("link container OPL002=>"+seturl);
        setddsnurl = ddsnurl+'?DeviceIP='+seturl+'&UUID='+setuuid
		client.get(setddsnurl, function (data, response) {
			console.log("get ok...") 				
		}).on("error", function(err) {console.log("err for client");});		
	});
}