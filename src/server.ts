import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import {
  adminAuthRegister,
  adminAuthLogin,
  adminUserDetails,
  adminAuthLogout,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate,
} from './auth';
import {
  adminQuizCreate,
  adminQuizList,
  adminQuizRemove,
  adminQuizInfo,
  adminQuizNameUpdate,
  adminQuizDescriptionUpdate,
  adminQuizViewTrash,
  adminQuizRestore,
  adminQuizEmptyTrash,
  adminQuizTransfer,
  adminQuizQuestionCreate,
  adminQuizQuestionUpdate,
  adminQuizQuestionDelete,
  adminQuizQuestionMove,
  adminQuizQuestionDuplicate,
  adminQuizThumbnailUpdate,
  adminQuizSessionStart,
  adminQuizSessionState,
  adminQuizSessionView,
  adminQuizSessionStatus,
  adminQuizSessionResults,
} from './quiz';
import {
  playerJoin,
  playerQuestionInfo,
  playerAnswerSubmission,
  playerStatus,
  playerChatSend,
  getQuestionResults,
  getPlayerSessionResults,
  showChat,
} from './player';
import { clear } from './other';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use(
  '/docs',
  sui.serve,
  sui.setup(YAML.parse(file), {
    swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' },
  })
);

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

// Protected routes
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  res.json(
    adminAuthRegister(
      req.body.email,
      req.body.password,
      req.body.nameFirst,
      req.body.nameLast
    )
  );
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  res.json(adminAuthLogin(req.body.email, req.body.password));
});

app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  res.json(adminUserDetails(req.headers.token as string));
});

app.get('/v2/admin/quiz/list', (req: Request, res: Response) => {
  res.json(adminQuizList(req.headers.token as string));
});

app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  res.json(
    adminQuizCreate(
      req.headers.token as string,
      req.body.name,
      req.body.description
    )
  );
});

app.delete('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  res.json(
    adminQuizRemove(
      req.headers.token as string,
      parseInt(req.params.quizid as string)
    )
  );
});

app.get('/v2/admin/quiz/trash', (req: Request, res: Response) => {
  res.json(adminQuizViewTrash(req.headers.token as string));
});

app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  res.json(
    adminQuizInfo(
      req.headers.token as string,
      parseInt(req.params.quizid as string)
    )
  );
});

app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  res.json(
    adminQuizNameUpdate(
      req.headers.token as string,
      parseInt(req.params.quizid as string),
      req.body.name
    )
  );
});

app.put('/v2/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  res.json(
    adminQuizDescriptionUpdate(
      req.headers.token as string,
      parseInt(req.params.quizid as string),
      req.body.description
    )
  );
});

app.delete('/v1/clear', (req: Request, res: Response) => {
  res.json(clear());
});

app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  res.json(adminAuthLogout(req.headers.token as string));
});

app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  res.json(
    adminUserDetailsUpdate(
      req.headers.token as string,
      req.body.email,
      req.body.nameFirst,
      req.body.nameLast
    )
  );
});

app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  res.json(
    adminUserPasswordUpdate(
      req.headers.token as string,
      req.body.oldPassword,
      req.body.newPassword
    )
  );
});

app.post('/v2/admin/quiz/:quizid/restore', (req: Request, res: Response) => {
  res.json(
    adminQuizRestore(
      req.headers.token as string,
      parseInt(req.params.quizid as string)
    )
  );
});

app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const quizIds = [];
  for (const id of req.query.quizIds) {
    quizIds.push(parseInt(id));
  }
  res.json(adminQuizEmptyTrash(req.headers.token as string, quizIds));
});

app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  res.json(
    adminQuizTransfer(
      req.headers.token as string,
      parseInt(req.params.quizid as string),
      req.body.userEmail
    )
  );
});

app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const body = req.body.questionBody;
  res.json(
    adminQuizQuestionCreate(
      req.headers.token as string,
      parseInt(req.params.quizid as string),
      body.question,
      body.duration,
      body.points,
      body.answers,
      body.thumbnailUrl
    )
  );
});

app.put(
  '/v2/admin/quiz/:quizid/question/:questionid',
  (req: Request, res: Response) => {
    const body = req.body.questionBody;
    res.json(
      adminQuizQuestionUpdate(
        req.headers.token as string,
        parseInt(req.params.quizid as string),
        parseInt(req.params.questionid as string),
        body.question,
        body.duration,
        body.points,
        body.answers,
        body.thumbnailUrl
      )
    );
  }
);

app.delete(
  '/v2/admin/quiz/:quizid/question/:questionid',
  (req: Request, res: Response) => {
    res.json(
      adminQuizQuestionDelete(
        req.headers.token as string,
        parseInt(req.params.quizid as string),
        parseInt(req.params.questionid as string)
      )
    );
  }
);

app.put(
  '/v2/admin/quiz/:quizid/question/:questionid/move',
  (req: Request, res: Response) => {
    res.json(
      adminQuizQuestionMove(
        req.headers.token as string,
        parseInt(req.params.quizid as string),
        parseInt(req.params.questionid as string),
        req.body.newPosition
      )
    );
  }
);

app.post(
  '/v2/admin/quiz/:quizid/question/:questionid/duplicate',
  (req: Request, res: Response) => {
    res.json(
      adminQuizQuestionDuplicate(
        req.headers.token as string,
        parseInt(req.params.quizid as string),
        parseInt(req.params.questionid as string)
      )
    );
  }
);

app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  res.json(
    adminQuizThumbnailUpdate(
      req.headers.token as string,
      parseInt(req.params.quizid as string),
      req.body.imgUrl
    )
  );
});

app.post(
  '/v1/admin/quiz/:quizid/session/start',
  (req: Request, res: Response) => {
    res.json(
      adminQuizSessionStart(
        req.headers.token as string,
        parseInt(req.params.quizid as string),
        req.body.autoStartNum
      )
    );
  }
);

app.put(
  '/v1/admin/quiz/:quizid/session/:sessionid',
  (req: Request, res: Response) => {
    res.json(
      adminQuizSessionState(
        req.headers.token as string,
        parseInt(req.params.quizid as string),
        parseInt(req.params.sessionid as string),
        req.body.action
      )
    );
  }
);

app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response) => {
  res.json(
    adminQuizSessionView(
      req.headers.token as string,
      parseInt(req.params.quizid as string)
    )
  );
});

app.get(
  '/v1/admin/quiz/:quizid/session/:sessionid/results',
  (req: Request, res: Response) => {
    res.json(
      adminQuizSessionResults(
        req.headers.token as string,
        parseInt(req.params.quizid as string),
        parseInt(req.params.sessionid as string)
      )
    );
  }
);

app.get(
  '/v1/admin/quiz/:quizid/session/:sessionid',
  (req: Request, res: Response) => {
    res.json(
      adminQuizSessionStatus(
        req.headers.token as string,
        parseInt(req.params.quizid as string),
        parseInt(req.params.sessionid as string)
      )
    );
  }
);

app.post('/v1/player/join', (req: Request, res: Response) => {
  res.json(playerJoin(parseInt(req.body.sessionId as string), req.body.name));
});

app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  res.json(playerStatus(parseInt(req.params.playerid as string)));
});

app.get(
  '/v1/player/:playerid/question/:questionposition',
  (req: Request, res: Response) => {
    res.json(
      playerQuestionInfo(
        parseInt(req.params.playerid as string),
        parseInt(req.params.questionposition as string)
      )
    );
  }
);

app.put(
  '/v1/player/:playerid/question/:questionposition/answer',
  (req: Request, res: Response) => {
    res.json(
      playerAnswerSubmission(
        parseInt(req.params.playerid as string),
        parseInt(req.params.questionposition as string),
        req.body.answerIds
      )
    );
  }
);

app.get(
  '/v1/player/:playerid/question/:questionposition/results',
  (req: Request, res: Response) => {
    res.json(
      getQuestionResults(
        parseInt(req.params.playerid as string),
        parseInt(req.params.questionposition as string)
      )
    );
  }
);

app.get('/v1/player/:playerid/results', (req: Request, res: Response) => {
  res.json(getPlayerSessionResults(parseInt(req.params.playerid as string)));
});

app.get('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  res.json(showChat(parseInt(req.params.playerid as string)));
});

app.post('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  res.json(
    playerChatSend(
      parseInt(req.params.playerid as string),
      req.body.message.messageBody
    )
  );
});
// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    404 Not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(404).json({ error });
});

// For handling errors
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
