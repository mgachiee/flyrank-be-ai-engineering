export interface TaskCreationAttributes {
  title: string;
  done: boolean;
}

export interface TaskAttributes extends TaskCreationAttributes {
  id: number;
}