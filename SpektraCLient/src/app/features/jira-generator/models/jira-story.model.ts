export interface JiraStory {
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints?: number;
}
