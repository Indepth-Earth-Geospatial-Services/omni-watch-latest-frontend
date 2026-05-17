// User and workspace types

export interface DJIUser {
  userId: string;
  username: string;
  workspaceName: string;
  userType: string;
  mqttUsername?: string;
  mqttPassword?: string;
  createTime: string;  // ISO timestamp
}

export interface UpdateUserRequest {
  userId?: string;
  username?: string;
  workspaceName?: string;
  userType?: string;
  mqttUsername?: string;
  mqttPassword?: string;
  createTime?: string;
}

export interface WorkspaceUsersResponse {
  list: DJIUser[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
  };
}

export interface DJIWorkspace {
  workspace_id: string;
  workspace_name: string;
  workspace_description: string;
  create_time: number;
  update_time: number;
}
