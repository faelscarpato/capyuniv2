import './react-snippets';
import './git-skill';
import './test-runner';

let bootstrapped = false;

export const bootstrapExtensions = (): void => {
  if (bootstrapped) return;
  bootstrapped = true;
};
