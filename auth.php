<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = '$2y$10$RNB.QVB0IThm7H0srY7CAeB2l/uzXZyYAKRTzD4.LEbemxPWdSWYq';

function isAdminAuthenticated() {
    return !empty($_SESSION['admin_authenticated']);
}

function authenticateAdminCredentials($username, $password) {
    return $username === ADMIN_USERNAME && password_verify($password, ADMIN_PASSWORD_HASH);
}

function requireAdminAuth() {
    if (isAdminAuthenticated()) {
        return;
    }

    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}
?>
