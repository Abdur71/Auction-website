<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . 'auth.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$username = trim((string) ($payload['username'] ?? ''));
$password = (string) ($payload['password'] ?? '');

if (!authenticateAdminCredentials($username, $password)) {
    $_SESSION['admin_authenticated'] = false;
    echo json_encode(['error' => 'Invalid username or password']);
    exit;
}

$_SESSION['admin_authenticated'] = true;
unset($_SESSION['admin_otp'], $_SESSION['admin_otp_username'], $_SESSION['admin_otp_expires_at']);

echo json_encode(['success' => true]);
?>
