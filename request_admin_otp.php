<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . 'auth.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
echo json_encode(['error' => 'Email OTP login is disabled. Use username and password login.']);
?>
