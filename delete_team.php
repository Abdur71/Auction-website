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

$id = isset($payload['id']) ? intval($payload['id']) : 0;
if ($id <= 0) {
    echo json_encode(['error' => 'Invalid team ID']);
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

$filteredTeams = array_values(array_filter($teams, static function ($team) use ($id) {
    return intval($team['id'] ?? 0) !== $id;
}));

if (count($filteredTeams) === count($teams)) {
    echo json_encode(['error' => 'Team not found']);
    exit;
}

foreach ($filteredTeams as $index => $team) {
    $filteredTeams[$index]['id'] = $index + 1;
}

if (file_put_contents($teamsFile, json_encode($filteredTeams, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) === false) {
    echo json_encode(['error' => 'Could not delete team']);
    exit;
}

echo json_encode([
    'success' => true
]);
?>
