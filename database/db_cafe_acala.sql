-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 08, 2026 at 02:02 AM
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
(1, 'assets/logo_acala_-_Salin-removebg-preview.png', 'assets/logo_acala-removebg-preview.png', 'Acala Coffee & Eatery adalah coffee & eatery yang berada di kawasan Pasawahan, kaki Gunung Ciremai, sekitar 30 menit dari Cirebon dan 1 jam dari Majalengka. Konsepnya menggabungkan coffee shop, ruang nongkrong, dan tempat untuk bekerja dengan suasana industrial garden. Acala memiliki area indoor, outdoor, dan rooftop dengan daya tarik utama berupa suasana terbuka, pemandangan persawahan, serta Gunung Ciremai.', 'assets/acala.png', 'Unfinished Escape', 'Acala Reservation', 'Reservasi dapat dilakukan langsung melalui form di website, sehingga proses booking jadi lebih praktis dan cepat. Kamu bisa memilih meja indoor dengan nuansa hangat atau outdoor dengan atmosfer alami sesuai preferensi.', 'assets/duduk.jpg', 'Jl. Pasawahan, Pasawahan, Kec. Pasawahan, Kabupaten Kuningan, Jawa Barat 45559', 'https://maps.app.goo.gl/YJC855MqBPNThfi36', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.7813415546134!2d108.42684257364743!3d-6.796437466467504!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e6f1f4d5b9a85e3%3A0x52857f90ac4c3a82!2sAcala%20Coffee%20%26%20Eatery!5e0!3m2!1sid!2sid!4v1791342172402!5m2!1sid!2sid', '+62 857 9727 5590', 'acalacafe@gmail.com', 'https://www.instagram.com/acala_cne', 'https://vm.tiktok.com/ZS9DCyE8Ttnvg-zngAg/', '2026-10-07 08:52:03');

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
(1, 'Coffee Workshop', 'coffee-workshop', 'Pelajari teknik meracik dan menyeduh kopi dalam pengalaman workshop yang seru dan interaktif.', 'assets/seduh.JPG', '2026-10-11', '19:00:00', 'Acala Cafe & Eatery', 'aktif', '2026-10-07 04:48:25', '2026-10-07 04:48:25'),
(2, 'Open Mic', 'open-mic', 'Nikmati malam penuh musik dan kreativitas, saat para talenta berbagi suara, cerita, dan penampilan terbaik mereka di panggung Cafe Acala.', 'assets/meeting.png', '2026-10-18', '09:00:00', 'Acala Cafe & Eatery', 'aktif', '2026-10-07 04:50:16', '2026-10-07 04:50:16'),
(3, 'Live Music', 'live-music', 'Nikmati suasana hangat bersama alunan musik secara langsung, ditemani kopi dan hidangan favorit di Cafe Acala.', 'assets/live music.png', '2026-10-31', '20:00:00', 'Acala Cafe & Eatery', 'aktif', '2026-10-07 04:52:32', '2026-10-07 04:52:32');

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
(1, 5, 'Matcha Latte', 'matcha-latte', 'Minuman matcha dengan perpaduan susu yang lembut dan creamy.', 25000, 'assets/Refreshing_iced_matcha_latte___free_image_by_-removebg-preview.png', 'best_seller', 1, 'aktif', '2026-10-07 05:32:46', '2026-10-07 07:19:28'),
(2, 5, 'Dubai Choco', 'dubai-choco', 'Minuman cokelat dengan rasa manis dan creamy yang cocok dinikmati kapan saja.', 30000, 'assets/Dubai_Chocolate_Strawberry_Cup-removebg-preview.png', 'best_seller', 2, 'aktif', '2026-10-07 05:32:46', '2026-10-07 07:19:48'),
(3, 5, 'Goguma Smoothies', 'goguma-smoothies', 'Smoothies dengan cita rasa ubi manis yang lembut dan creamy.', 35000, 'assets/blueberry smoothies.png', 'best_seller', 3, 'aktif', '2026-10-07 05:32:46', '2026-10-07 07:19:58'),
(4, 1, 'Cafe Latte', 'cafe-latte', 'Perpaduan espresso dan susu steamed dengan rasa yang lembut dan creamy.', 21000, 'assets/iced coffe delight.png', 'best_seller', 4, 'aktif', '2026-10-07 05:32:46', '2026-10-07 07:20:08');

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
