<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$teamsFile = __DIR__ . DIRECTORY_SEPARATOR . 'teams.json';

if (!file_exists($teamsFile)) {
    echo json_encode([
        'teams' => []
    ]);
    exit;
}

$content = file_get_contents($teamsFile);
if ($content === false || trim($content) === '') {
    echo json_encode([
        'teams' => []
    ]);
    exit;
}

$data = json_decode($content, true);
if (!is_array($data)) {
    echo json_encode([
        'teams' => []
    ]);
    exit;
}

$teams = array_values(array_filter($data, static function ($team) {
    return is_array($team);
}));

echo json_encode([
    'teams' => $teams
]);
?>
