import path from 'node:path';
import fs from 'fs-extra';
import { gt } from 'lodash-es';
import chalk from 'chalk';
import axios from 'axios';
import { input, select } from '@inquirer/prompts';
import { clone } from '../utils/clone';
import { name, version } from '../../package.json';

// template类型
interface TemplateInfo {
  name: string; // 模板名称
  downloadUrl: string; // 模板下载地址
  description: string; // 模板描述
  branch: string; // 模板分支
}

// 模板
const templates: Map<string, TemplateInfo> = new Map([
  [
    'vue3-base-tempalte',
    {
      name: 'vue3-base-template',
      downloadUrl: 'https://gitee.com/yutingtao91/vue3-project.git',
      description: 'Vue3基础开发模板',
      branch: 'base',
    },
  ],
  [
    'vue3-admin-template',
    {
      name: 'vue3-admin-template',
      downloadUrl: 'https://gitee.com/yutingtao91/vue3-project.git',
      description: 'Vue3管理后台开发模板',
      branch: 'master',
    },
  ],
]);

// 是否覆盖写入
function isOverwrite(name: string) {
  console.warn(`${name}文件夹存在`);
  return select({
    message: '是否覆盖?',
    choices: [
      { name: '覆盖', value: true },
      { name: '取消', value: false },
    ],
  });
}

// 获取NPM版本
async function getNpmVersion(name: string) {
  try {
    const res = await axios.get(`https://registry.npmjs.org/${name}`);
    return res.data['dist-tags'].latest;
  } catch (error) {
    console.error(error);
  }
}

// 检测版本
async function checkVersion(name: string, version: string) {
  const latestVersion = await getNpmVersion(name);
  const need = gt(latestVersion, version);
  if (need) {
    console.warn(`检查到最新版本：${chalk.blackBright(latestVersion)}，当前版本是：${chalk.blackBright(version)}`);
    console.log(`可使用：${chalk.yellow('npm i ytt-vue-cli@latest')}，或者使用：${chalk.yellow('ytt update')}更新`);
  }
  return need;
}

export async function create(projectName: string) {
  // 初始化模板列表
  const templateList = Array.from(templates).map((item: [string, TemplateInfo]) => {
    const [name, info] = item;
    return {
      name,
      value: name,
      description: info.description,
    };
  });
  if (!projectName) {
    projectName = await input({ message: '请输入项目名称' });
  }

  // 如果文件夹存在，则提示是否覆盖
  const filePath = path.resolve(process.cwd(), projectName);
  if (fs.existsSync(filePath)) {
    const run = await isOverwrite(projectName);
    if (run) {
      await fs.remove(filePath);
    } else {
      return; // 不覆盖直接结束
    }
  }

  // 检查版本更新
  await checkVersion(name, version);

  const templateName = await select({
    message: '请选择模板',
    choices: templateList,
  });
  const info = templates.get(templateName);
  if (info) {
    clone(info.downloadUrl, projectName, ['-b', info.branch]);
  }
  console.log('create', projectName);
}
