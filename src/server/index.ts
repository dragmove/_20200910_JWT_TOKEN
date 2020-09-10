import * as express from 'express';

const PORT = process.env.PORT || 9001;

const app = express();

app.get('/', (req: any, res: any) => {
  res.send('Hello World');
});

app.listen(PORT, () => {
  console.log(`Listening to http://localhost:${PORT}`);
});
