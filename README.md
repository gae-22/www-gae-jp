# www-gae-jp

![Astro](https://img.shields.io/badge/Astro-5.0-BC52EE?style=for-the-badge&logo=astro&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

This repository hosts the personal portfolio and blog of **gae**, an engineer and designer dedicated to exploring the boundary between digital and reality.

The project serves as both a portfolio of works and an experimental ground for cutting-edge web technologies, designed with a focus on "aesthetic excellence" and "high performance."

## About Content

This platform publishes insights and records across three main pillars:

### 1. Technology & Engineering

Technical deep dives into modern web development, focusing on performance optimization and architecture.

- **Frontend**: Advanced usage of Astro, Next.js, and React.
- **Backend/System**: Insights from SaaS development and system engineering.
- **Research**: Notes on wireless communication (V2V) and academic studies.

### 2. Design & Aesthetics

Explorations of UI/UX design philosophies, emphasizing the fusion of beauty and function.

- **Visual Style**: Glassmorphism, motion graphics, and immersive interfaces.
- **Philosophy**: Analyzing what makes a digital experience "comfortable" and "engaging."

### 3. Personal Journey

A record of my carrier and growth as a developer.

- **Projects**: Archives of past development work (30+ projects).
- **Timeline**: Milestones from university research (UEC), internships, and community leadership.

## Technical Overview

While the focus is on content, the platform itself is built to demonstrate modern high-performance web architecture.

- **Framework**: Astro v5 (Zero-JS by default)
- **Styling**: Tailwind CSS v4
- **Content System**: Type-safe MDX with Astro Content Collections
- **Typography**: Self-hosted fonts via `@fontsource`

## Project Structure

The codebase is organized to separate content from presentation logic clearly.

- `src/content/`: The core of the repository. Contains all Blog posts, Project details, and Profile data (YAML/MDX).
- `src/components/`: Reusable UI elements implementing the specific design system.
- `src/pages/`: Routing logic using Astro's file-system routing.

## License

This project is licensed under the [MIT License](LICENSE).
