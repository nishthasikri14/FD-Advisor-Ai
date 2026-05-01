# 💰 FD Advisor AI

An AI-powered full-stack web application that helps users plan **Fixed Deposit (FD)** investments smartly with **ladder strategies, bank comparisons, and automated email alerts**.

---

## 🚀 Features

### 🪜 FD Ladder Builder

* Create optimized FD ladder strategies
* Balance **returns + liquidity**
* Smart allocation across multiple tenures

### 🏦 Bank Rate Comparison

* Compare FD rates across multiple banks
* Helps choose best returns

### 🤖 AI Financial Advisor

* Powered by **Gemini API**
* Answers FD-related queries
* Suggests investment strategies (India-focused)

### 🔔 FD Maturity Alerts

* Automated **email notifications**
* Alerts sent at:

  * 30 days before maturity
  * 7 days before
  * 1 day before
* Built using **Cron Jobs + Nodemailer**

### 🔐 Authentication

* Secure login/register system
* JWT-based authentication

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Modern UI with responsive design

### Backend

* Node.js
* Express.js

### Database

* MongoDB (Mongoose)

### Integrations

* Gemini API (AI Advisor)
* Nodemailer (Email alerts)
* Node-cron (Scheduled jobs)

---

## 📂 Project Structure

fd-advisor-ai/
│
├── fd-ladder-backend/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│
├── frontend/
│   ├── src/
│   ├── public/

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/nishthasikri14/FD-Advisor-Ai.git
cd FD-Advisor-Ai
```

---

### 2️⃣ Install dependencies

#### Backend

```bash
cd fd-ladder-backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

---

### 3️⃣ Environment Variables

Create a `.env` file inside `fd-ladder-backend/`:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
GEMINI_API_KEY=your_api_key
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

---

### 4️⃣ Run the app

#### Backend

```bash
cd fd-ladder-backend
npm start
```

#### Frontend

```bash
cd frontend
npm start
```

---

## 📸 Screenshots

*(Add your app screenshots here for better presentation)*

---

## 🔐 Security Note

* Sensitive data like API keys and credentials are stored in `.env`
* `.env` is excluded using `.gitignore`
* Credentials should never be committed to version control

---

## 📈 Future Improvements

* 🔔 In-app notifications (bell icon)
* 📊 Dashboard for FD tracking
* 🤖 AI-based reinvestment suggestions
* 📱 SMS/WhatsApp alerts

---

## 👩‍💻 Author

**Nishtha Sikri**

---

## ⭐ Show your support

If you like this project, give it a ⭐ on GitHub!
