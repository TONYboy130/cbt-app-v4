import React, { useState, useEffect } from "react";
import "./index.css";

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex],
    ];
  }
  return array;
}

function normalize(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[①-④]/g, c => ({ '①': '1', '②': '2', '③': '3', '④': '4' }[c] || c)).trim();
}

function App() {
  const [remainingTime, setRemainingTime] = useState(2700);
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem("authenticated") === "true");
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

const loadQuestions = () => {
-  fetch(process.env.PUBLIC_URL + "/cbt_questions_2900_prefixed.json")
+  fetch(process.env.PUBLIC_URL + "/cbt_questions_213.json")
     .then(res => res.json())
     .then(data => {
-      const shuffled = shuffle(data).slice(0, 25);
+      const shuffled = shuffle(data).slice(0, 25); // 25문제씩 랜덤 추출
       setShuffledQuestions(shuffled);
       setRemainingTime(2700);
       setCurrentIndex(0);
       setScore(0);
     });
};

  useEffect(() => {
    if (authenticated) loadQuestions();
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated || isFinished) return;
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [authenticated, isFinished]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const input = e.target.elements.password.value;
    if (input === "0430") {
      setAuthenticated(true);
      localStorage.setItem("authenticated", "true");
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  const handleOptionClick = (option) => {
    setShuffledQuestions(prev => {
      const updated = [...prev];
      updated[currentIndex].selected = option;
      return updated;
    });
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex + 1 < shuffledQuestions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      let calculatedScore = 0;
      shuffledQuestions.forEach(q => {
        if (normalize(q.selected) === normalize(q.answer)) {
          calculatedScore++;
        }
      });
      setScore(calculatedScore);
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setShowExplanation(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleRetry = () => {
    loadQuestions();
  };

  if (!authenticated) {
    return (
      <div className="app">
        <h2>시험 입장</h2>
        <form onSubmit={handlePasswordSubmit}>
          <input type="password" name="password" placeholder="비밀번호 입력" />
          <button type="submit">입장</button>
        </form>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / shuffledQuestions.length) * 100);
    return (
      <div className="app">
        <h2>시험 종료!</h2>
        <p>점수: {score} / {shuffledQuestions.length} ({percentage}점)</p>
        <p>{score >= 18 ? "✅ 합격입니다!" : "❌ 불합격입니다."}</p>
        <button onClick={handleRetry}>다음 시험</button>
        <h3>복습 모드</h3>
        {shuffledQuestions.map((q, i) => (
          <div key={i} className="review">
            <p><strong>{i + 1}. {q.question}</strong></p>
            {q.options.map((opt, idx) => {
              const isCorrect = normalize(opt) === normalize(q.answer);
              const isSelected = normalize(opt) === normalize(q.selected);
              const icon = isCorrect && isSelected ? "✅ " : "";
              return (
                <p
                  key={idx}
                  style={{
                    color: isCorrect ? "green" : isSelected ? "red" : "black",
                    fontWeight: isCorrect || isSelected ? "bold" : "normal",
                    backgroundColor: isSelected ? "#fce4ec" : "transparent"
                  }}
                >
                  {icon}{opt}
                </p>
              );
            })}
            <p><strong>정답:</strong> {q.answer}</p>
            <p><strong>해설:</strong> {q.explanation}</p>
            <hr />
          </div>
        ))}
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentIndex];

  if (!currentQuestion) {
    return <div className="app">문제를 불러오는 중입니다...</div>;
  }

  const currentSelection = normalize(currentQuestion.selected);
  const correctAnswer = normalize(currentQuestion.answer);

  return (
    <div className="app">
      <h3>⏰ 남은 시간: {Math.floor(remainingTime / 60).toString().padStart(2, "0")}:{(remainingTime % 60).toString().padStart(2, "0")}</h3>
      <h2>문제 {currentIndex + 1} / {shuffledQuestions.length}</h2>
      <p><strong>{currentQuestion.question}</strong></p>
      <ul>
        {currentQuestion.options.map((option, index) => {
          const normalized = normalize(option);
          const isSelected = normalized === currentSelection;
          return (
            <li
              key={index}
              onClick={() => handleOptionClick(option)}
              style={{
                backgroundColor: isSelected ? "#fce4ec" : "",
                fontWeight: isSelected ? "bold" : "normal",
                color: "black"
              }}
            >
              {option}
            </li>
          );
        })}
      </ul>
      <button onClick={() => setShowExplanation(!showExplanation)}>
        해설 보기
      </button>
      {showExplanation && (
        <div className="explanation">
          <p><strong>해설:</strong> {currentQuestion.explanation}</p>
        </div>
      )}
      <div style={{ marginTop: "10px" }}>
        <button onClick={handlePrev} disabled={currentIndex === 0}>이전 문제</button>
        <button onClick={handleNext}>다음 문제</button>
      </div>
    </div>
  );
}

export default App;
