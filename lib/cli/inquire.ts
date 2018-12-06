import inquirer from 'inquirer';

const inquire = (inquiries: any[]): Promise<object> => {
  return inquirer.prompt(inquiries);
};

export default inquire;
