<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . 'auth.php';
requireAdminAuth();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$teamsFile = __DIR__ . DIRECTORY_SEPARATOR . 'teams.json';

$rawInput = file_get_contents('php://input');
$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

$teamName = trim((string) ($payload['team_name'] ?? ''));
$ownerName = trim((string) ($payload['owner_name'] ?? ''));
$ownerPlayerId = isset($payload['owner_player_id']) ? intval($payload['owner_player_id']) : 0;

if ($teamName === '' || $ownerName === '') {
    echo json_encode(['error' => 'Team name and owner name are required']);
    exit;
}

$teams = [];
if (file_exists($teamsFile)) {
    $content = file_get_contents($teamsFile);
    $decoded = json_decode($content, true);
    if (is_array($decoded)) {
        $teams = $decoded;
    }
}

$teams[] = [
    'id' => count($teams) + 1,
    'teamName' => $teamName,
    'ownerName' => $ownerName,
    'ownerPlayerId' => $ownerPlayerId > 0 ? $ownerPlayerId : null,
    'createdAt' => date('c'),
];

if (file_put_contents($teamsFile, json_encode($teams, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) {
    echo json_encode(['error' => 'Could not save team']);
    exit;
}

echo json_encode([
    'success' => true,
    'team' => $teams[count($teams) - 1]
]);
?>
