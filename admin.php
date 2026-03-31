<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . 'auth.php';

if (!isAdminAuthenticated()) {
    header('Location: admin_login.php');
    exit;
}

readfile(__DIR__ . DIRECTORY_SEPARATOR . 'admin_app.html');
?>
