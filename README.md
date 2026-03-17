# Aero-Biker
**Scalable Management System for Spinning Studios**

Welcome to the **Aero-Biker** repository! This is the capstone project for team DRP04. The goal of this system is to solve the core operational challenges of a modern spinning studio, focusing on physical class capacity control (bicycle limits) and the management of student plans and subscriptions.

## Technology Stack
This project was built focusing on robustness, type safety, and an accessible learning curve for the entire team:

* **Backend:** Node.js + TypeScript + Express
* **Database:** PostgreSQL + Sequelize (ORM)
* **View / Frontend:** Handlebars (SSR) + Pure Tailwind CSS
* **Code Quality:** Biome (Linter/Formatter) + Husky (Git Hooks)
* **Build:** Pkgroll

## Architecture (Modern MVC)
The project follows an extended MVC pattern with a Service Layer to keep the code clean and avoid *Fat Controllers*.

* `/models`: Database table mapping (Sequelize).
* `/services`: The core of the application. Contains business rules and heavy database queries.
* `/controllers`: Flow orchestrators. They solely receive the request, call the corresponding Service, and render the View.
* `/routes`: Definition of API endpoints and web pages.
* `/views`: Where the user interface takes shape using HTML styled with Tailwind.