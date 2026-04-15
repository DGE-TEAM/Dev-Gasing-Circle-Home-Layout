import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { inject as service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default class GcTopicItem extends Component {
  @service currentUser;
  @service dialog;
  
  @tracked isLiked = false;
  @tracked likeCount = 0;
  @tracked isLiking = false;

  constructor() {
    super(...arguments);
    this.likeCount = this.args.topic.likeCount || 0;
    this.isLiked = this.args.topic.liked || false;
  }

  @action
  async toggleLike(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!this.currentUser) {
      if (this.dialog && this.dialog.alert) {
        this.dialog.alert("Silakan login untuk menyukai topik ini.");
      }
      return;
    }
    
    if (this.isLiking) return;
    this.isLiking = true;

    try {
      let postId = this.args.topic.firstPostId;
      if (!postId) {
        const res = await ajax(`/t/${this.args.topic.id}.json`);
        postId = res?.post_stream?.posts?.[0]?.id;
        if (postId) {
          this.args.topic.firstPostId = postId;
        }
      }

      if (!postId) {
        throw new Error("Gagal mengambil post ID");
      }

      if (this.isLiked) {
        await ajax(`/post_actions/${postId}`, {
          type: "DELETE",
          data: { post_action_type_id: 2 }
        });
        this.isLiked = false;
        this.likeCount = Math.max(0, this.likeCount - 1);
      } else {
        const result = await ajax("/post_actions", {
          type: "POST",
          data: { id: postId, post_action_type_id: 2, flag_topic: false }
        });
        const serverCount = result?.post?.actions_summary?.find((a) => a.id === 2)?.count;
        this.isLiked = true;
        this.likeCount = serverCount !== undefined ? serverCount : this.likeCount + 1;
      }
    } catch (err) {
      popupAjaxError(err);
    } finally {
      this.isLiking = false;
    }
  }
}
