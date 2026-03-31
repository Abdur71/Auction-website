<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . 'auth.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
echo json_encode(['error' => 'OTP login is disabled. Use admin_authenticate.php with username and password.']);
?>
