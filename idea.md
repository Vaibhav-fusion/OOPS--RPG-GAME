# TapQuest – Backend Driven Click RPG

## 1. Project Overview

TapQuest is a full-stack web-based mini RPG game where users tap to defeat monsters, gain XP, level up, and purchase upgrades.

Unlike traditional clicker games, all game logic (damage calculation, monster scaling, XP progression, upgrade effects, leaderboard ranking) is handled entirely by the backend to prevent cheating and ensure system integrity.

The frontend (React) acts only as a UI layer that sends requests and renders updated game state.

---

## 2. Problem Statement

Most clicker games rely heavily on frontend logic, making them vulnerable to manipulation and cheating. TapQuest solves this by designing a secure, backend-driven game engine where:

- Damage is calculated server-side
- XP scaling is validated server-side
- Upgrade costs are computed server-side
- Leaderboard ranking is controlled server-side

This project emphasizes backend system design, OOP principles, and scalable architecture.

---

## 3. Core Features

### Authentication
- User Registration
- User Login
- JWT-based session management

### Hero System
- Each user owns one Hero
- Hero has level, XP, gold, damage stats
- Automatic leveling system

### Tap System
- Each tap sends a request to backend
- Backend calculates damage
- Monster HP is reduced
- Rewards given when monster dies

### Monster System
- Dynamic monster generation based on hero level
- Scalable HP and reward system
- Automatic respawn after defeat

### Upgrade System
- Damage boost upgrades
- Critical hit chance upgrades
- Auto-tap unlock
- Exponential cost scaling

### Leaderboard
- Global ranking by level and total damage
- Auto-updated

---

## 4. System Design Focus

Backend implements:

- OOP principles (encapsulation, inheritance, polymorphism)
- Service-layer architecture
- Factory Pattern (Monster creation)
- Strategy Pattern (Damage calculation)
- Singleton (Leaderboard service)
- Clean separation of controllers, services, repositories

---

## 5. Scope

Frontend:
- Login/Register
- Game Dashboard
- Tap Button
- HP/XP bars
- Upgrade shop
- Leaderboard page

Backend:
- Complete game engine
- Secure API
- Data persistence
- Business logic handling
- Anti-cheat validation

---

## 6. Future Enhancements

- Multiplayer boss battles
- Achievement system
- Seasonal leaderboards
- Real-time websocket battle updates
