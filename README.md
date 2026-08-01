<div align="center">

<img src="public/Logo.jpg" width="120" height="120" alt="Portfolio Logo" />

# Kadari Arjun Reddy Portfolio

A modern, interactive portfolio website showcasing my projects, experience, and technical skills, built with a focus on performance, smooth animations, and responsive design.

<p>

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-purple?style=for-the-badge&logo=framer)
![MIT License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

</p>

<p>
<a href="https://arjun-portfolio-tawny.vercel.app/">🌐 Live Website</a> •
<a href="https://www.linkedin.com/in/arjun-reddy-95ba4934a/">LinkedIn</a> •
<a href="mailto:arjunreddykadari89@gmail.com">Email</a>
</p>

</div>

---

# About

This repository contains the source code for my personal portfolio website.

The portfolio highlights my background, professional experience, technical projects, and software engineering work in AI, machine learning, and full-stack development.

Designed with a clean, modern interface inspired by award-winning web experiences, it emphasizes usability, responsiveness, and smooth user interactions.

---

# Features

- Modern and responsive user interface
- Interactive animations powered by Framer Motion
- Smooth scrolling experience using Lenis
- Dark and light theme support
- Project showcase with impact metrics, highlights, and pipeline breakdowns
- System architecture section detailing each project layer by layer
- Professional experience timeline and education/career roadmap
- Certifications and downloadable resume
- AI assistant that answers questions about my work
- Technical skills overview
- Contact section with social links
- Optimized for desktop, tablet, and mobile devices

---

# AI Assistant

The portfolio includes a chat assistant at `/api/chat` that answers visitor questions about my
projects, stack, experience, and availability.

It runs in two modes:

- **With `ANTHROPIC_API_KEY` set** — questions go to Claude, grounded in a knowledge base built
  from `contents/en.json` so answers stay factual.
- **Without a key** — a keyword-matched local responder in `lib/portfolio-knowledge.ts` answers
  from the same content. No setup, no cost, no dead input box.

To enable the Claude-backed mode, add `ANTHROPIC_API_KEY` to your Vercel project environment
variables (or a local `.env.local`) and redeploy. See `.env.example`.

---

# Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

### Animation

- Framer Motion
- Lenis

### Deployment

- Vercel

---

# Live Demo

🌐 **https://arjun-portfolio-tawny.vercel.app/**

---

<div align="center">

Built by **Kadari Arjun Reddy**

</div>
