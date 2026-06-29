-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Хост: localhost
-- Время создания: Апр 08 2026 г., 10:24
-- Версия сервера: 5.7.27-30-log
-- Версия PHP: 8.3.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `rabota3508`
--

-- --------------------------------------------------------

--
-- Структура таблицы `Categories`
--

CREATE TABLE `Categories` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `parentCategory` int(11) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `Chats`
--

CREATE TABLE `Chats` (
  `id` int(11) NOT NULL,
  `orderId` int(11) NOT NULL,
  `customerId` int(11) NOT NULL,
  `masterId` int(11) DEFAULT NULL,
  `orderTitle` varchar(255) DEFAULT NULL,
  `lastMessage` text,
  `lastMessageAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `Messages`
--

CREATE TABLE `Messages` (
  `id` int(11) NOT NULL,
  `chatId` int(11) NOT NULL,
  `senderId` int(11) NOT NULL,
  `text` text NOT NULL,
  `read` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `Orders`
--

CREATE TABLE `Orders` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `categoryName` varchar(255) DEFAULT NULL,
  `status` enum('new','in_progress','awaiting_confirmation','completed','cancelled') DEFAULT 'new',
  `customerId` int(11) NOT NULL,
  `masterId` int(11) DEFAULT NULL,
  `customerName` varchar(255) DEFAULT NULL,
  `customerPhone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT '',
  `phoneVisible` tinyint(1) DEFAULT '1',
  `takenAt` datetime DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `masterCompletedAt` datetime DEFAULT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `cityData` json DEFAULT NULL,
  `isTemporary` tinyint(1) DEFAULT '0',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `PasswordResetTokens`
--

CREATE TABLE `PasswordResetTokens` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `expiresAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `Reviews`
--

CREATE TABLE `Reviews` (
  `id` int(11) NOT NULL,
  `orderId` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text,
  `pros` json DEFAULT NULL,
  `cons` json DEFAULT NULL,
  `photos` json DEFAULT NULL,
  `targetRole` enum('client','master') DEFAULT NULL,
  `clientId` int(11) NOT NULL,
  `masterId` int(11) NOT NULL,
  `isVerified` tinyint(1) DEFAULT '1',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `Users`
--

CREATE TABLE `Users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('client','master') NOT NULL,
  `city` varchar(255) DEFAULT '',
  `experience` int(11) DEFAULT '0',
  `specializations` json DEFAULT NULL,
  `profile` json DEFAULT NULL,
  `rating` float DEFAULT '0',
  `reviewsCount` int(11) DEFAULT '0',
  `lastLogin` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `Categories`
--
ALTER TABLE `Categories`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `Chats`
--
ALTER TABLE `Chats`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `Messages`
--
ALTER TABLE `Messages`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `Orders`
--
ALTER TABLE `Orders`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `PasswordResetTokens`
--
ALTER TABLE `PasswordResetTokens`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `Reviews`
--
ALTER TABLE `Reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reviews_order_id` (`orderId`);

--
-- Индексы таблицы `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`),
  ADD UNIQUE KEY `phone_2` (`phone`),
  ADD UNIQUE KEY `phone_3` (`phone`),
  ADD UNIQUE KEY `phone_4` (`phone`),
  ADD UNIQUE KEY `phone_5` (`phone`),
  ADD UNIQUE KEY `phone_6` (`phone`),
  ADD UNIQUE KEY `phone_7` (`phone`),
  ADD UNIQUE KEY `phone_8` (`phone`),
  ADD UNIQUE KEY `phone_9` (`phone`),
  ADD UNIQUE KEY `phone_10` (`phone`),
  ADD UNIQUE KEY `phone_11` (`phone`),
  ADD UNIQUE KEY `phone_12` (`phone`),
  ADD UNIQUE KEY `phone_13` (`phone`),
  ADD UNIQUE KEY `phone_14` (`phone`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `email_4` (`email`),
  ADD UNIQUE KEY `email_5` (`email`),
  ADD UNIQUE KEY `email_6` (`email`),
  ADD UNIQUE KEY `email_7` (`email`),
  ADD UNIQUE KEY `email_8` (`email`),
  ADD UNIQUE KEY `email_9` (`email`),
  ADD UNIQUE KEY `email_10` (`email`),
  ADD UNIQUE KEY `email_11` (`email`),
  ADD UNIQUE KEY `email_12` (`email`),
  ADD UNIQUE KEY `email_13` (`email`),
  ADD UNIQUE KEY `email_14` (`email`),
  ADD KEY `users_phone` (`phone`),
  ADD KEY `users_email` (`email`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `Categories`
--
ALTER TABLE `Categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `Chats`
--
ALTER TABLE `Chats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `Messages`
--
ALTER TABLE `Messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `Orders`
--
ALTER TABLE `Orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `PasswordResetTokens`
--
ALTER TABLE `PasswordResetTokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `Reviews`
--
ALTER TABLE `Reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT для таблицы `Users`
--
ALTER TABLE `Users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
