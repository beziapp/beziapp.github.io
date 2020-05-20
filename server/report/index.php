<?php
	header("Content-Type: text/plain");
	$warning = "this beziapp report service is here to inform the developers of client errors and stores IP address, user agent ".
		"and error details. The error reporting is not mandatory and can be distabled in the settings. If you want to delete any of ".
		"your personal information submitted to this server or if you want a data dump of your error entries, please send an email".
		"to the maintainers of this beziapp reporting server (sijanecantonluka@gmail.com). We do not store any other information, ".
		"such as usernames, so if you have a dynamic IP and it changes, there's no way of proving that you sent the reports. If ".
		"that's the case, we won't delete or provide any error reports to you. You must have proof of IP address ownership by ".
		"requesting a special link that we will send you via email when data deletion/dump will be requested. Again, failing the ".
		"IP address verification process will force us into not sending or deleting any data. GDPR sucks.";
	if($_REQUEST["type"] != "error") {
		http_response_code(400);
		exit("only error reports are supported on this instance. ".$warning);
	}
	if(empty($_REQUEST["client"]["app_version"])) {
		http_response_code(400);
		exit("you must provide your app version. ".$warning);
	}

	$servername = "localhost";
	$username = "beziappreports";
	$password = "not today!";
	$dbname = "beziappreports";
	$conn = new mysqli($servername, $username, $password, $dbname);
	if ($conn->connect_error) {
		http_response_code(500);
		die("database connection failed. ".$warning); // . $conn->connect_error);
	}

	$query = "CREATE TABLE IF NOT EXISTS error_reports (
		msg							VARCHAR(420)		,
		url							VARCHAR(420)		,
		line						INT							,
		colno					INT							,
		obj							VARCHAR(420)		,
		ua							VARCHAR(420)		,
		app_version			VARCHAR(420)		,
		previous_commit	VARCHAR(69)			,
		ip							VARCHAR(69)			,
	)";
	$result = mysqli_query($dbConnection, $conn);

	$stmt = $conn->prepare("INSERT INTO error_reports (msg, url, line, colno, obj, ua, app_version, previous_commit, ip) VALUES".
		"(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
	$stmt->bind_param("ssiisssss", $_REQUEST["error"]["msg"], $_REQUEST["error"]["url"], $_REQUEST["error"]["line"],
		$_REQUEST["error"]["column"], $_REQUEST["error"]["obj"], $_REQUEST["client"]["ua"], $_REQUEST["client"]["app_version"],
		$_REQUEST["client"]["previous_commit"], $_SERVER["REMOTE_ADDR"]);

	$stmt->execute();

	$stmt->close();
	$conn->close();

	exit("report saved. ".$warning);
?>
