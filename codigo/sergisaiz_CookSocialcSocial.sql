-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 26, 2025 at 06:32 PM
-- Server version: 10.11.9-MariaDB-ubu2204
-- PHP Version: 8.2.23

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sergisaiz_CookSocial`
--

-- --------------------------------------------------------

--
-- Table structure for table `categorias_receta`
--

CREATE TABLE `categorias_receta` (
  `id` int(11) NOT NULL,
  `nombre_categoria` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categorias_receta`
--

INSERT INTO `categorias_receta` (`id`, `nombre_categoria`) VALUES
(4, 'Bebida'),
(2, 'Entrante'),
(1, 'Plato Principal'),
(3, 'Postre');

-- --------------------------------------------------------

--
-- Table structure for table `comentarios_receta`
--

CREATE TABLE `comentarios_receta` (
  `id` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `contenido` text NOT NULL,
  `fecha_comentario` timestamp NULL DEFAULT current_timestamp(),
  `es_visible` tinyint(1) DEFAULT 1 COMMENT 'TRUE si visible, FALSE si oculto por moderación'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ingredientes_receta`
--

CREATE TABLE `ingredientes_receta` (
  `id` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `descripcion_ingrediente` varchar(255) NOT NULL COMMENT 'Ej: "200g de harina", "1 pizca de sal"'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `likes_receta`
--

CREATE TABLE `likes_receta` (
  `id_usuario` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `fecha_like` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` int(11) NOT NULL,
  `id_usuario_receptor` int(11) NOT NULL COMMENT 'Usuario que recibe la notificación',
  `tipo` enum('comentario','like','seguidor','sistema_moderacion') NOT NULL,
  `mensaje` text NOT NULL,
  `id_origen_contenido` int(11) DEFAULT NULL COMMENT 'ID del contenido relacionado (receta, comentario, usuario)',
  `tipo_origen_contenido` varchar(50) DEFAULT NULL COMMENT 'Tipo de contenido: "receta", "comentario", "usuario"',
  `enlace_relacionado` varchar(255) DEFAULT NULL COMMENT 'URL para redirigir al usuario',
  `leida` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 = no leída, 1 = leída',
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pasos_preparacion`
--

CREATE TABLE `pasos_preparacion` (
  `id` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `numero_paso` int(11) NOT NULL,
  `descripcion_paso` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `recetas`
--

CREATE TABLE `recetas` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `id_categoria` int(11) DEFAULT NULL,
  `tiempo_preparacion_min` int(11) NOT NULL,
  `porciones` varchar(50) NOT NULL,
  `id_tipo_dieta` int(11) DEFAULT NULL,
  `dificultad` enum('facil','normal','dificil') NOT NULL,
  `visibilidad` enum('publica','privada') DEFAULT 'publica',
  `consejos_chef` text DEFAULT NULL,
  `fecha_publicacion` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `recetas_guardadas`
--

CREATE TABLE `recetas_guardadas` (
  `id_usuario` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `fecha_guardado` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reportes_comentario`
--

CREATE TABLE `reportes_comentario` (
  `id` int(11) NOT NULL,
  `id_comentario` int(11) NOT NULL,
  `id_receta_asociada` int(11) NOT NULL COMMENT 'ID de la receta para referencia rápida',
  `id_usuario_reportador` int(11) DEFAULT NULL COMMENT 'NULL si el reporte es anónimo',
  `fecha_reporte` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('Pendiente','Revisado','Comentario Ocultado') NOT NULL DEFAULT 'Pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reportes_receta`
--

CREATE TABLE `reportes_receta` (
  `id` int(11) NOT NULL,
  `id_receta` int(11) NOT NULL,
  `id_usuario_reportador` int(11) DEFAULT NULL,
  `fecha_reporte` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre_rol` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `nombre_rol`) VALUES
(2, 'Administrador'),
(1, 'SuperAdministrador'),
(3, 'Usuario');

-- --------------------------------------------------------

--
-- Table structure for table `seguidores`
--

CREATE TABLE `seguidores` (
  `id_usuario_seguidor` int(11) NOT NULL COMMENT 'El usuario que sigue',
  `id_usuario_seguido` int(11) NOT NULL COMMENT 'El usuario que es seguido',
  `fecha_seguimiento` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tickets_soporte`
--

CREATE TABLE `tickets_soporte` (
  `id` int(11) NOT NULL,
  `nombre_remitente` varchar(100) NOT NULL,
  `email_remitente` varchar(100) NOT NULL,
  `mensaje` text NOT NULL,
  `fecha_envio` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` enum('Pendiente','Solucionado') NOT NULL DEFAULT 'Pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tipos_dieta_receta`
--

CREATE TABLE `tipos_dieta_receta` (
  `id` int(11) NOT NULL,
  `nombre_dieta` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tipos_dieta_receta`
--

INSERT INTO `tipos_dieta_receta` (`id`, `nombre_dieta`) VALUES
(11, 'Alcalina'),
(12, 'Ayurvédica'),
(7, 'Baja en carbohidratos'),
(8, 'Baja en grasas'),
(14, 'Baja en sodio'),
(10, 'DASH (Para Hipertensos)'),
(4, 'Frutariana'),
(15, 'Hiperproteica'),
(16, 'Hipocalórica'),
(9, 'Mediterránea'),
(1, 'Omnívora'),
(5, 'Pescetariana'),
(17, 'Sin frutos secos'),
(6, 'Sin gluten'),
(13, 'Sin lactosa'),
(3, 'Vegana'),
(2, 'Vegetariana');

-- --------------------------------------------------------

--
-- Table structure for table `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nombre_completo` varchar(100) DEFAULT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `id_rol` int(11) NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `usuarios`
--

INSERT INTO `usuarios` (`id`, `username`, `email`, `password_hash`, `nombre_completo`, `avatar_url`, `bio`, `id_rol`, `fecha_registro`) VALUES
(1, 'SuperAdministrador', 'cook_social@gmail.com', 'Password1.', 'Super Administrador', NULL, 'Super administrador de la pagina', 1, '2025-05-21 14:14:43');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categorias_receta`
--
ALTER TABLE `categorias_receta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre_categoria` (`nombre_categoria`);

--
-- Indexes for table `comentarios_receta`
--
ALTER TABLE `comentarios_receta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_receta` (`id_receta`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indexes for table `ingredientes_receta`
--
ALTER TABLE `ingredientes_receta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_receta` (`id_receta`);

--
-- Indexes for table `likes_receta`
--
ALTER TABLE `likes_receta`
  ADD PRIMARY KEY (`id_usuario`,`id_receta`),
  ADD KEY `id_receta` (`id_receta`);

--
-- Indexes for table `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notificaciones_usuario_receptor_idx` (`id_usuario_receptor`);

--
-- Indexes for table `pasos_preparacion`
--
ALTER TABLE `pasos_preparacion`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_receta_paso_unico` (`id_receta`,`numero_paso`);

--
-- Indexes for table `recetas`
--
ALTER TABLE `recetas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_categoria` (`id_categoria`),
  ADD KEY `id_tipo_dieta` (`id_tipo_dieta`);

--
-- Indexes for table `recetas_guardadas`
--
ALTER TABLE `recetas_guardadas`
  ADD PRIMARY KEY (`id_usuario`,`id_receta`),
  ADD KEY `fk_recetas_guardadas_receta_idx` (`id_receta`),
  ADD KEY `fk_recetas_guardadas_usuario_idx` (`id_usuario`);

--
-- Indexes for table `reportes_comentario`
--
ALTER TABLE `reportes_comentario`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_reporte_unico_usuario_comentario` (`id_comentario`,`id_usuario_reportador`),
  ADD KEY `fk_reportescom_comentario_idx` (`id_comentario`),
  ADD KEY `fk_reportescom_receta_idx` (`id_receta_asociada`),
  ADD KEY `fk_reportescom_usuario_idx` (`id_usuario_reportador`);

--
-- Indexes for table `reportes_receta`
--
ALTER TABLE `reportes_receta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_reporte_unico_usuario_receta` (`id_receta`,`id_usuario_reportador`),
  ADD KEY `fk_reportesrec_receta_idx` (`id_receta`),
  ADD KEY `fk_reportesrec_usuario_idx` (`id_usuario_reportador`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre_rol` (`nombre_rol`);

--
-- Indexes for table `seguidores`
--
ALTER TABLE `seguidores`
  ADD PRIMARY KEY (`id_usuario_seguidor`,`id_usuario_seguido`),
  ADD KEY `fk_seguidores_usuario_seguido_idx` (`id_usuario_seguido`);

--
-- Indexes for table `tickets_soporte`
--
ALTER TABLE `tickets_soporte`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `tipos_dieta_receta`
--
ALTER TABLE `tipos_dieta_receta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre_dieta` (`nombre_dieta`);

--
-- Indexes for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_rol` (`id_rol`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categorias_receta`
--
ALTER TABLE `categorias_receta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `comentarios_receta`
--
ALTER TABLE `comentarios_receta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ingredientes_receta`
--
ALTER TABLE `ingredientes_receta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pasos_preparacion`
--
ALTER TABLE `pasos_preparacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `recetas`
--
ALTER TABLE `recetas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reportes_comentario`
--
ALTER TABLE `reportes_comentario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reportes_receta`
--
ALTER TABLE `reportes_receta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tickets_soporte`
--
ALTER TABLE `tickets_soporte`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tipos_dieta_receta`
--
ALTER TABLE `tipos_dieta_receta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `comentarios_receta`
--
ALTER TABLE `comentarios_receta`
  ADD CONSTRAINT `comentarios_receta_ibfk_1` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comentarios_receta_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ingredientes_receta`
--
ALTER TABLE `ingredientes_receta`
  ADD CONSTRAINT `ingredientes_receta_ibfk_1` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `likes_receta`
--
ALTER TABLE `likes_receta`
  ADD CONSTRAINT `likes_receta_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_receta_ibfk_2` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `fk_notificaciones_usuario_receptor` FOREIGN KEY (`id_usuario_receptor`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pasos_preparacion`
--
ALTER TABLE `pasos_preparacion`
  ADD CONSTRAINT `pasos_preparacion_ibfk_1` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `recetas`
--
ALTER TABLE `recetas`
  ADD CONSTRAINT `recetas_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recetas_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias_receta` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `recetas_ibfk_3` FOREIGN KEY (`id_tipo_dieta`) REFERENCES `tipos_dieta_receta` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `recetas_guardadas`
--
ALTER TABLE `recetas_guardadas`
  ADD CONSTRAINT `fk_recetas_guardadas_receta` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_recetas_guardadas_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reportes_comentario`
--
ALTER TABLE `reportes_comentario`
  ADD CONSTRAINT `fk_reportescom_comentario` FOREIGN KEY (`id_comentario`) REFERENCES `comentarios_receta` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reportescom_receta` FOREIGN KEY (`id_receta_asociada`) REFERENCES `recetas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reportescom_usuario` FOREIGN KEY (`id_usuario_reportador`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `reportes_receta`
--
ALTER TABLE `reportes_receta`
  ADD CONSTRAINT `fk_reportesrec_receta` FOREIGN KEY (`id_receta`) REFERENCES `recetas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reportesrec_usuario` FOREIGN KEY (`id_usuario_reportador`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `seguidores`
--
ALTER TABLE `seguidores`
  ADD CONSTRAINT `fk_seguidores_usuario_seguido` FOREIGN KEY (`id_usuario_seguido`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_seguidores_usuario_seguidor` FOREIGN KEY (`id_usuario_seguidor`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `usuarios_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
