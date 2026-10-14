<?php

$host = "localhost";
$username = "root";
$password = "";
$database = "db_cafe_acala";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    die("Koneksi database gagal");
}

$conn->set_charset("utf8mb4");