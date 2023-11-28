import { getData, setData } from './dataStore';
export function clear(): object {
  const data = getData();
  data.users = [];
  data.quizzes = [];
  data.userSessions = [];
  data.quizSessions.forEach((q) => {
    clearTimeout(q.questionCountDown);
    clearTimeout(q.questionDuration);
    q.questionCountDown = undefined;
    q.questionDuration = undefined;
  });
  data.quizSessions = [];
  data.questions = [];
  data.results = [];
  data.players = [];
  data.trash = [];
  data.messages = [];
  setData(data);
  return {};
}
