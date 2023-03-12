export namespace Discord {
  export interface MessageSendOptions {
    /**
     * override the default username of the webhook
     */
    username?: string;

    /**
     * override the default avatar of the webhook
     */
    avatar_url?: string;

    /**
     * the message contents (up to 2000 characters)
     */
    content?: string;

    /**
     * attachment objects
     */
    files?: { name: string; data: Uint8Array[] }[];
  }

  export interface Message {
    id: string;
    content: string;
    channel_id: string;
    author: {
      id: string;
      bot: boolean;
      username: string;
      discriminator: string;
    };
    attachments: {
      id: string;
      filename: string;
      size: number;
      url: string;
      proxy_url: string;
    }[];
  }
}

/**
 * Sends a message to the given webhook.
 */
export const SendMessage = async (
  webhookUrl: string,
  messageOptions: Discord.MessageSendOptions
) => {
  const formData = new FormData();

  formData.set(
    "payload_json",
    JSON.stringify({
      username: messageOptions.username,
      avatar_url: messageOptions.avatar_url,
      content: messageOptions.content,
      attachments: messageOptions.files?.map((file, index) => {
        return { id: index, filename: file.name };
      }),
    })
  );

  if (messageOptions.files) {
    messageOptions.files.forEach((file, index) => {
      formData.set(`files[${index}]`, new Blob(file.data));
    });
  }

  const response = await fetch(webhookUrl + "?wait=true", {
    method: "POST",
    body: formData,
  });

  return { status: response.status, data: await response.json() as Discord.Message };
};
