<?php


	error_reporting(E_ALL ^ E_DEPRECATED);
	// 設置資料類型 json，編碼格式 utf-8
	header('Content-Type: application/json; charset=UTF-8');


	$DeviceMD5 = @$_GET["UID"];
	$Type = @$_GET["Type"];
	$Action = @$_GET["Action"];
	$STU = '000000';
	$DeviceUUID = 'OFA1C0044826BEF87AEA0481'; //裝置UUID

	if ($Type == "LEDWAY" ) {
		
		//執行動作參數
		$CMD = '/PUMP' ; //類型
		$POS = 'E002'; //位置
		$action = @$_GET["Action"]; //動作
		$STU = '310000'; //STU
		$GROUP = '00'; // 群組編號

		//綜合參數
		$val = $CMD.'?Action='.$action.'&UUID='.$DeviceUUID.'&POS='.$POS.'&STU='.$STU.'&GROUP='.$GROUP ;
		//curl位置
		$url = 'http://192.168.5.116:3000'.$val;
		//定義位置1
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$output = curl_exec($ch);
		curl_close($ch);
		
		echo $output;
		exit;
	}elseif ($Type == "AIRCON" ) {
		
		//執行動作參數
		$CMD = '/PUMP' ; //類型
		$POS = 'E002'; //位置
		$action = @$_GET["Action"]; //動作
		$STU = '4F0000'; //STU
		$GROUP = '00'; // 群組編號
		//綜合參數
		$val = $CMD.'?Action='.$action.'&UUID='.$DeviceUUID.'&POS='.$POS.'&STU='.$STU.'&GROUP='.$GROUP ;
		//curl位置
		$url = 'http://192.168.5.116:3000'.$val;
		//定義位置1
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$output = curl_exec($ch);
		curl_close($ch);
		echo $output;
		exit;
	}elseif ($Type == "AUX_RH") {
		
		//執行動作參數
		$CMD = '/PUMP' ; //類型
		$POS = 'E002'; //位置
		$action = @$_GET["Action"]; //動作
		$STU = '520000'; //STU
		$GROUP = '00'; // 群組編號
		
		//綜合參數
		$val = $CMD.'?Action='.$action.'&UUID='.$DeviceUUID.'&POS='.$POS.'&STU='.$STU.'&GROUP='.$GROUP ;
		$url = 'http://192.168.5.116:3000'.$val;
		//定義位置1
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$output = curl_exec($ch);
		curl_close($ch);
		
		echo $output;
	}elseif ($Type == "Cyclefan") {
		
		//執行動作參數
		$CMD = '/PUMP' ; //類型
		$POS = 'E002'; //位置
		$action = @$_GET["Action"]; //動作
		$STU = '320000'; //STU
		$GROUP = '00'; // 群組編號
		//綜合參數
		$val = $CMD.'?Action='.$action.'&UUID='.$DeviceUUID.'&POS='.$POS.'&STU='.$STU.'&GROUP='.$GROUP ;
		//curl位置
		$url = 'http://192.168.5.116:3000'.$val;
		//定義位置1
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$output = curl_exec($ch);
		curl_close($ch);
		echo $output;

		exit;
	}elseif ($Type == "SystemAuto") {
		echo json_encode(array('Type' => $Type,'success' => 'true'), JSON_NUMERIC_CHECK);
		exit;
	}elseif ($Type == "Refreshfan") {
		
		//執行動作參數
		$CMD = '/PUMP' ; //類型
		$POS = 'E002'; //位置
		$action = @$_GET["Action"]; //動作
		$STU = '450000'; //STU
		$GROUP = '00'; // 群組編號

		//綜合參數
		$val = $CMD.'?Action='.$action.'&UUID='.$DeviceUUID.'&POS='.$POS.'&STU='.$STU.'&GROUP='.$GROUP ;
		//curl位置
		$url = 'http://192.168.5.116:3000'.$val;

		//定義位置1
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$output = curl_exec($ch);
		curl_close($ch);
		
		echo $output;
		exit;
	}elseif ($Type == "SystemPower") {
		
		//執行動作參數
		$CMD = '/AUTO' ; //類型
		$POS = 'J000'; //位置
		$action = @$_GET["Action"]; //動作
		$STU = '000000'; //STU
		$GROUP = '00'; // 群組編號

		//綜合參數
		$val = $CMD.'?Action='.$action.'&UUID='.$DeviceUUID.'&POS='.$POS.'&STU='.$STU.'&GROUP='.$GROUP ;
		//curl位置
		$url = 'http://192.168.5.116:3000'.$val;

		//定義位置1
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		$output = curl_exec($ch);
		curl_close($ch);
		
		echo $output;
		exit;
	}

?>