-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
<<<<<<< HEAD:database/db_cafe_acala.sql
-- Generation Time: Oct 13, 2026 at 08:13 AM
=======
-- Generation Time: Oct 13, 2026 at 08:23 AM
>>>>>>> e9a7b8b383ddd335df6e73264da9c80c22ea6061:backend/database/db_cafe_acala.sql
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_cafe_acala`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `username`, `password_hash`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2y$10$M8kUR4T23xii7GoUxSHAPuKzRmziwj.z.Gw/bpuxnG5TYtrAQR2xq', '2026-10-07 04:18:13', '2026-10-07 04:18:13');

-- --------------------------------------------------------

--
-- Table structure for table `area`
--

CREATE TABLE `area` (
  `id` int NOT NULL,
  `nama_area` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lantai` int DEFAULT NULL,
  `jenis` enum('indoor','outdoor') COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `gambar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int NOT NULL DEFAULT '0',
  `status` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `area`
--

INSERT INTO `area` (`id`, `nama_area`, `lantai`, `jenis`, `deskripsi`, `gambar`, `urutan`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Indoor Area', 1, 'indoor', 'Area indoor yang nyaman untuk menikmati kopi, makanan, maupun berkumpul bersama teman dan keluarga.', NULL, 1, 'aktif', '2026-10-07 05:38:42', '2026-10-07 05:38:42'),
(2, 'Outdoor Area - Lantai 1', 1, 'outdoor', 'Area outdoor di lantai 1 dengan suasana terbuka dan santai, cocok untuk menikmati kopi dan makanan bersama teman maupun keluarga.', NULL, 2, 'aktif', '2026-10-07 05:38:42', '2026-10-07 05:38:42'),
(3, 'Outdoor Area - Lantai 2', 2, 'outdoor', 'Area outdoor di lantai 2 yang menawarkan suasana terbuka dan nyaman untuk bersantai.', NULL, 3, 'aktif', '2026-10-07 05:38:42', '2026-10-07 05:38:42');

-- --------------------------------------------------------

--
-- Table structure for table `cafe`
--

CREATE TABLE `cafe` (
  `id` int NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `gambar_about` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `judul_about` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `judul_reservasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deskripsi_reservasi` text COLLATE utf8mb4_unicode_ci,
  `gambar_reservasi` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alamat` text COLLATE utf8mb4_unicode_ci,
  `link_maps` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maps_embed_url` text COLLATE utf8mb4_unicode_ci,
  `whatsapp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instagram` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tiktok` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cafe`
--

INSERT INTO `cafe` (`id`, `nama`, `logo`, `deskripsi`, `gambar_about`, `judul_about`, `judul_reservasi`, `deskripsi_reservasi`, `gambar_reservasi`, `alamat`, `link_maps`, `maps_embed_url`, `whatsapp`, `email`, `instagram`, `tiktok`, `updated_at`) VALUES
(1, 'uploads/cafe/nama-cafe.png', 'uploads/cafe/logo-cafe.png', 'Acala Coffee & Eatery adalah coffee & eatery yang berada di kawasan Pasawahan, kaki Gunung Ciremai, sekitar 30 menit dari Cirebon dan 1 jam dari Majalengka. Konsepnya menggabungkan coffee shop, ruang nongkrong, dan tempat untuk bekerja dengan suasana industrial garden. Acala memiliki area indoor, outdoor, dan rooftop dengan daya tarik utama berupa suasana terbuka, pemandangan persawahan, serta Gunung Ciremai.', 'uploads/cafe/gambar-about.png', 'Unfinished Escape', 'Acala Reservation', 'Reservasi dapat dilakukan langsung melalui form di website, sehingga proses booking jadi lebih praktis dan cepat. Kamu bisa memilih meja indoor dengan nuansa hangat atau outdoor dengan atmosfer alami sesuai preferensi.', 'uploads/cafe/gambar-reservasi.jpg', 'Jl. Pasawahan, Pasawahan, Kec. Pasawahan, Kabupaten Kuningan, Jawa Barat 45559', 'https://maps.app.goo.gl/YJC855MqBPNThfi36', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.7813415546134!2d108.42684257364743!3d-6.796437466467504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f1f4d5b9a85e3%3A0x52857f90ac4c3a82!2sAcala%20Coffee%20%26%20Eatery!5e0!3m2!1sid!2sid!4v1791342172402!5m2!1sid!2sid', '+62 857 9727 5590', 'acalacafe@gmail.com', 'https://www.instagram.com/acala_cne', 'https://vm.tiktok.com/ZS9DCyE8Ttnvg-zngAg/', '2026-10-13 08:06:32');

-- --------------------------------------------------------

--
-- Table structure for table `carousel`
--

CREATE TABLE `carousel` (
  `id` int NOT NULL,
  `id_event` int NOT NULL,
  `urutan` int NOT NULL DEFAULT '1',
  `status` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `carousel`
--

INSERT INTO `carousel` (`id`, `id_event`, `urutan`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 'aktif', '2026-10-07 04:38:35', '2026-10-07 05:09:11'),
(2, 2, 2, 'aktif', '2026-10-07 05:16:04', '2026-10-07 05:16:04'),
(3, 3, 3, 'aktif', '2026-10-07 05:16:04', '2026-10-07 05:16:04');

-- --------------------------------------------------------

--
-- Table structure for table `event`
--

CREATE TABLE `event` (
  `id` int NOT NULL,
  `nama` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(170) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `gambar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `waktu` time DEFAULT NULL,
  `lokasi` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event`
--

INSERT INTO `event` (`id`, `nama`, `slug`, `deskripsi`, `gambar`, `tanggal`, `waktu`, `lokasi`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Coffee Workshop', 'coffee-workshop', 'Pelajari teknik meracik dan menyeduh kopi dalam pengalaman workshop yang seru dan interaktif.', 'uploads/event/coffe-workshop.jpg', '2026-10-11', '19:00:00', 'Acala Cafe & Eatery', 'aktif', '2026-10-07 04:48:25', '2026-10-13 08:09:26'),
(2, 'Open Mic', 'open-mic', 'Nikmati malam penuh musik dan kreativitas, saat para talenta berbagi suara, cerita, dan penampilan terbaik mereka di panggung Cafe Acala.', 'uploads/event/open-mic.png', '2026-10-18', '09:00:00', 'Acala Cafe & Eatery', 'aktif', '2026-10-07 04:50:16', '2026-10-13 08:10:09'),
(3, 'Live Music', 'live-music', 'Nikmati suasana hangat bersama alunan musik secara langsung, ditemani kopi dan hidangan favorit di Cafe Acala.', 'uploads/event/live-music.png', '2026-10-31', '20:00:00', 'Acala Cafe & Eatery', 'aktif', '2026-10-07 04:52:32', '2026-10-13 08:10:46');

-- --------------------------------------------------------

--
-- Table structure for table `faq`
--

CREATE TABLE `faq` (
  `id` int NOT NULL,
  `pertanyaan` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `jawaban` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `urutan` int NOT NULL DEFAULT '0',
  `status` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `faq`
--

INSERT INTO `faq` (`id`, `pertanyaan`, `jawaban`, `urutan`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Apa itu Cafe Acala?', 'Cafe Acala adalah tempat untuk menikmati kopi, makanan, dan berbagai kegiatan seperti workshop, open mic, serta live music dalam suasana yang nyaman dan hangat.', 1, 'aktif', '2026-10-07 05:17:04', '2026-10-07 05:17:04'),
(2, 'Apakah saya bisa melakukan reservasi?', 'Ya. Reservasi dapat dilakukan melalui kontak WhatsApp yang tersedia pada website. Silakan cantumkan tanggal, waktu, dan jumlah orang saat melakukan reservasi.', 2, 'aktif', '2026-10-07 05:17:04', '2026-10-07 05:17:04'),
(3, 'Apakah Cafe Acala mengadakan event?', 'Ya. Cafe Acala mengadakan berbagai event seperti Coffee Workshop, Open Mic, dan Live Music. Informasi event dapat dilihat pada halaman Event.', 3, 'aktif', '2026-10-07 05:17:04', '2026-10-07 05:17:04');

-- --------------------------------------------------------

--
-- Table structure for table `gallery`
--

CREATE TABLE `gallery` (
  `id` int NOT NULL,
  `judul` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gambar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `urutan` int NOT NULL DEFAULT '0',
  `status` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `menu`
--

CREATE TABLE `menu` (
  `id` int NOT NULL,
  `category_id` int NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `harga` int NOT NULL,
  `gambar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `label` enum('best_seller','new') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `urutan` int NOT NULL DEFAULT '0',
  `status` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menu`
--

INSERT INTO `menu` (`id`, `category_id`, `nama`, `slug`, `deskripsi`, `harga`, `gambar`, `label`, `urutan`, `status`, `created_at`, `updated_at`) VALUES
(5, 1, 'Cafe Latte', 'cafe-latte', NULL, 14000, 'uploads/menu/default-menu.png', NULL, 1, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(6, 1, 'Cappuccino', 'cappuccino', NULL, 16000, 'uploads/menu/default-menu.png', NULL, 2, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(7, 1, 'Mochoccino', 'mochoccino', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 3, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(8, 1, 'Cafe Latte Vanilla', 'cafe-latte-vanilla', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 4, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(9, 1, 'Cafe Latte Caramel', 'cafe-latte-caramel', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 5, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(10, 1, 'Cafe Latte Hazelnut', 'cafe-latte-hazelnut', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 6, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(11, 1, 'Cafe Latte Tiramisu', 'cafe-latte-tiramisu', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 7, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(12, 1, 'Cafe Latte Salted Caramel', 'cafe-latte-salted-caramel', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 8, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(13, 1, 'Comel', 'comel', 'Hanya tersedia dingin (ice only).', 20000, 'uploads/menu/default-menu.png', NULL, 9, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(14, 1, 'Acala Basic', 'acala-basic', 'Hanya tersedia dingin (ice only).', 18000, 'uploads/menu/default-menu.png', NULL, 10, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(15, 1, 'Hammock', 'hammock', 'Hanya tersedia dingin (ice only).', 20000, 'uploads/menu/default-menu.png', NULL, 11, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(16, 1, 'Bootcamp', 'bootcamp', 'Hanya tersedia dingin (ice only).', 20000, 'uploads/menu/default-menu.png', NULL, 12, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(17, 1, 'Salted Caramel Mocca', 'salted-caramel-mocca', 'Hanya tersedia dingin (ice only).', 20000, 'uploads/menu/default-menu.png', NULL, 13, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(18, 1, 'Matchaccino', 'matchaccino', 'Hanya tersedia dingin (ice only).', 20000, 'uploads/menu/default-menu.png', NULL, 14, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(19, 1, 'Red Fusion', 'red-fusion', 'Hanya tersedia dingin (ice only).', 20000, 'uploads/menu/default-menu.png', NULL, 15, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(20, 1, 'Butterscotch Sea Salt', 'butterscotch-sea-salt', 'Hanya tersedia dingin (ice only).', 22000, 'uploads/menu/default-menu.png', NULL, 16, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(21, 2, 'Americano', 'americano', NULL, 13000, 'uploads/menu/default-menu.png', NULL, 17, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(22, 2, 'Long Black', 'long-black', NULL, 13000, 'uploads/menu/default-menu.png', NULL, 18, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(23, 2, 'Romano', 'romano', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 19, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(24, 2, 'Acala Basic 1.000 ml', 'acala-basic-1000ml', 'Tambahan shot: double shot +Rp4.000, triple shot +Rp6.000.', 80000, 'uploads/menu/default-menu.png', NULL, 20, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(25, 3, 'French Press', 'french-press', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 21, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(26, 3, 'V60 Japanese', 'v60-japanese', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 22, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(27, 3, 'Aeropress', 'aeropress', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 23, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(28, 3, 'Vietnam Drip', 'vietnam-drip', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 24, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(29, 3, 'Tubruk', 'tubruk', NULL, 10000, 'uploads/menu/default-menu.png', NULL, 25, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(30, 4, 'Mango Butterfly', 'mango-butterfly', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 26, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(31, 4, 'Green Lady', 'green-lady', NULL, 16000, 'uploads/menu/default-menu.png', NULL, 27, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(32, 4, 'Lemon Citrus', 'lemon-citrus', NULL, 16000, 'uploads/menu/default-menu.png', NULL, 28, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(33, 4, 'Sunrise', 'sunrise', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 29, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(34, 4, 'Cira Aquamarine', 'cira-aquamarine', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 30, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(35, 5, 'Chocolate', 'chocolate', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 31, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(36, 5, 'Matcha', 'matcha', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 32, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(37, 5, 'Bubblegum', 'bubblegum', NULL, 16000, 'uploads/menu/default-menu.png', NULL, 33, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(38, 5, 'Taro', 'taro', NULL, 16000, 'uploads/menu/default-menu.png', NULL, 34, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(39, 5, 'Red Velvet', 'red-velvet', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 35, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(40, 5, 'Cookies n Cream', 'cookies-n-cream', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 36, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(41, 5, 'Matcha Orange', 'matcha-orange', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 37, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(42, 5, 'Lotus Matcha Coco', 'lotus-matcha-coco', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 38, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(43, 5, 'Matcha Mango', 'matcha-mango', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 39, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(44, 6, 'Orange Mojito', 'orange-mojito', NULL, 16000, 'uploads/menu/default-menu.png', NULL, 40, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(45, 6, 'Strawberry Mojito', 'strawberry-mojito', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 41, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(46, 6, 'Mango Mojito', 'mango-mojito', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 42, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(47, 7, 'Lemon Tea', 'lemon-tea', NULL, 13000, 'uploads/menu/default-menu.png', NULL, 43, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(48, 7, 'Lychee Tea', 'lychee-tea', NULL, 14000, 'uploads/menu/default-menu.png', NULL, 44, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(49, 7, 'Tea', 'tea', NULL, 10000, 'uploads/menu/default-menu.png', NULL, 45, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(50, 7, 'Mineral Water', 'mineral-water', NULL, 6000, 'uploads/menu/default-menu.png', NULL, 46, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(51, 8, 'Elmacho', 'elmacho', NULL, 16000, 'uploads/menu/default-menu.png', NULL, 47, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(52, 8, 'Affogato', 'affogato', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 48, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(53, 9, 'Croissant Butter', 'croissant-butter', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 49, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(54, 9, 'Croissant Dark Chocolate', 'croissant-dark-chocolate', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 50, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(55, 9, 'Croissant Matcha Biscoff', 'croissant-matcha-biscoff', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 51, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(56, 9, 'Croissant White Chocolate', 'croissant-white-chocolate', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 52, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(57, 9, 'Crombolloni Dark Chocolate', 'crombolloni-dark-chocolate', NULL, 22000, 'uploads/menu/default-menu.png', NULL, 53, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(58, 9, 'Crombolloni White Chocolate', 'crombolloni-white-chocolate', NULL, 22000, 'uploads/menu/default-menu.png', NULL, 54, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(59, 9, 'Crombolloni Matcha Biscoff', 'crombolloni-matcha-biscoff', NULL, 22000, 'uploads/menu/default-menu.png', NULL, 55, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(60, 10, 'Snack Acala', 'snack-acala', NULL, 22000, 'uploads/menu/default-menu.png', NULL, 56, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(61, 10, 'Cireng Ayam Suwir', 'cireng-ayam-suwir', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 57, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(62, 10, 'Pisang Krispi', 'pisang-krispi', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 58, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(63, 10, 'Nugget Isi 5', 'nugget-isi-5', NULL, 14000, 'uploads/menu/default-menu.png', NULL, 59, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(64, 10, 'Nugget Isi 10', 'nugget-isi-10', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 60, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(65, 10, 'Co Cheese', 'co-cheese', NULL, 15000, 'uploads/menu/default-menu.png', NULL, 61, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(66, 10, 'Costick', 'costick', NULL, 14000, 'uploads/menu/default-menu.png', NULL, 62, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(67, 11, 'Ricebowl Chicken Blackpepper', 'ricebowl-chicken-blackpepper', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 63, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(68, 11, 'Ricebowl Ayam Sambal Matah', 'ricebowl-ayam-sambal-matah', NULL, 22000, 'uploads/menu/default-menu.png', NULL, 64, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(69, 11, 'Ricebowl Chicken Katsu', 'ricebowl-chicken-katsu', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 65, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(70, 11, 'Nasi Goreng', 'nasi-goreng', NULL, 22000, 'uploads/menu/default-menu.png', NULL, 66, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(71, 11, 'Ayam Geprek', 'ayam-geprek', NULL, 22000, 'uploads/menu/default-menu.png', NULL, 67, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(72, 11, 'Ayam Saus Mentega', 'ayam-saus-mentega', NULL, 22000, 'uploads/menu/default-menu.png', NULL, 68, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(73, 11, 'Sate Taichan', 'sate-taichan', 'Tambahan: nasi atau lontong.', 20000, 'uploads/menu/default-menu.png', NULL, 69, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(74, 11, 'Spicy Wings', 'spicy-wings', 'Tambahan: nasi atau french fries.', 20000, 'uploads/menu/default-menu.png', NULL, 70, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(75, 11, 'Acala Noodle Soup', 'acala-noodle-soup', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 71, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(76, 11, 'Mie Acala', 'mie-acala', NULL, 18000, 'uploads/menu/default-menu.png', NULL, 72, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(77, 12, 'Cheese Beef Burger', 'cheese-beef-burger', NULL, 22000, 'uploads/menu/default-menu.png', NULL, 73, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(78, 12, 'Cheese Chicken Burger', 'cheese-chicken-burger', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 74, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12'),
(79, 12, 'Cheese Egg Burger', 'cheese-egg-burger', NULL, 20000, 'uploads/menu/default-menu.png', NULL, 75, 'aktif', '2026-10-13 07:56:12', '2026-10-13 07:56:12');

-- --------------------------------------------------------

--
-- Table structure for table `menu_category`
--

CREATE TABLE `menu_category` (
  `id` int NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `urutan` int NOT NULL DEFAULT '0',
  `status` enum('aktif','nonaktif') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'aktif',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `menu_category`
--

INSERT INTO `menu_category` (`id`, `nama`, `slug`, `urutan`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Milk Based Coffe', 'milk-based-coffe', 1, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(2, 'Black Coffe', 'black-coffe', 2, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(3, 'Manual Brew', 'manual-brew', 3, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(4, 'Moctail', 'moctail', 4, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(5, 'Milk Based', 'milk-based', 5, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(6, 'Mojito', 'mojito', 6, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(7, 'Tea', 'tea', 7, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(8, 'Dessert', 'dessert', 8, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(9, 'Pastry', 'pastry', 9, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(10, 'Snack', 'snack', 10, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(11, 'Main Course', 'main-course', 11, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56'),
(12, 'Light Meal', 'light-meal', 12, 'aktif', '2026-10-07 05:24:56', '2026-10-07 05:24:56');

-- --------------------------------------------------------

--
-- Table structure for table `operating_hours`
--

CREATE TABLE `operating_hours` (
  `id` int NOT NULL,
  `cafe_id` int NOT NULL,
  `hari` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `urutan` int NOT NULL DEFAULT '0',
  `is_closed` tinyint(1) NOT NULL DEFAULT '0',
  `jam_buka` time DEFAULT NULL,
  `jam_tutup` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `operating_hours`
--

INSERT INTO `operating_hours` (`id`, `cafe_id`, `hari`, `urutan`, `is_closed`, `jam_buka`, `jam_tutup`, `created_at`, `updated_at`) VALUES
(1, 1, 'Monday', 1, 0, '11:00:00', '23:00:00', '2026-10-07 05:36:09', '2026-10-07 05:36:09'),
(2, 1, 'Tuesday', 2, 0, '11:00:00', '23:00:00', '2026-10-07 05:36:09', '2026-10-07 05:36:09'),
(3, 1, 'Wednesday', 3, 0, '11:00:00', '23:00:00', '2026-10-07 05:36:09', '2026-10-07 05:36:09'),
(4, 1, 'Thursday', 4, 0, '11:00:00', '23:00:00', '2026-10-07 05:36:09', '2026-10-07 05:36:09'),
(5, 1, 'Friday', 5, 0, '09:00:00', '22:00:00', '2026-10-07 05:36:09', '2026-10-07 05:36:09'),
(6, 1, 'Saturday', 6, 0, '09:00:00', '22:00:00', '2026-10-07 05:36:09', '2026-10-07 05:36:09'),
(7, 1, 'Sunday', 7, 0, '09:00:00', '22:00:00', '2026-10-07 05:36:09', '2026-10-07 05:36:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `area`
--
ALTER TABLE `area`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cafe`
--
ALTER TABLE `cafe`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `carousel`
--
ALTER TABLE `carousel`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_id_event` (`id_event`);

--
-- Indexes for table `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `faq`
--
ALTER TABLE `faq`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `gallery`
--
ALTER TABLE `gallery`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `fk_menu_category` (`category_id`);

--
-- Indexes for table `menu_category`
--
ALTER TABLE `menu_category`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `operating_hours`
--
ALTER TABLE `operating_hours`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_operating_hours_cafe` (`cafe_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `area`
--
ALTER TABLE `area`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `cafe`
--
ALTER TABLE `cafe`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `carousel`
--
ALTER TABLE `carousel`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `event`
--
ALTER TABLE `event`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `faq`
--
ALTER TABLE `faq`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `gallery`
--
ALTER TABLE `gallery`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

--
-- AUTO_INCREMENT for table `menu_category`
--
ALTER TABLE `menu_category`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `operating_hours`
--
ALTER TABLE `operating_hours`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `carousel`
--
ALTER TABLE `carousel`
  ADD CONSTRAINT `fk_carousel_event` FOREIGN KEY (`id_event`) REFERENCES `event` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `menu`
--
ALTER TABLE `menu`
  ADD CONSTRAINT `fk_menu_category` FOREIGN KEY (`category_id`) REFERENCES `menu_category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Constraints for table `operating_hours`
--
ALTER TABLE `operating_hours`
  ADD CONSTRAINT `fk_operating_hours_cafe` FOREIGN KEY (`cafe_id`) REFERENCES `cafe` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
