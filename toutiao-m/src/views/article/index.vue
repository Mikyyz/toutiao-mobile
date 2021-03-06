<template>
    <div class="article-detail">
        <div class="article-container" ref="article-container">
            <van-nav-bar
                left-arrow
                fixed
                @click-left="$router.back()"
            >
                <div slot="title" v-if="!isScrollTopgt120">文章详情</div>
                <div slot="title" v-else-if="isScrollTopgt120" class="van-ellipsis">
                    {{article.title}}
                </div>
            </van-nav-bar>
            <div class="article-wrap">
                <h1 class="article-title">{{article.title}}</h1>
                <van-cell center class="user-info" :border="false">
                    <van-image 
                        slot="icon"
                        round
                        class="avatar"
                        :src="article.aut_photo" 
                    />
                    <span slot="title" class="user-name">{{article.aut_name}}</span>
                    <span slot="label" class="pubdate">
                        {{article.pubdate | relativeTime}}
                    </span>
                    <van-button 
                        v-if="article.is_followed" 
                        plain round size="small"  
                        class="follow" 
                        @click="toggleFollowUser"
                        :loading="isFollowLoading"
                    >
                        已关注
                    </van-button>
                    <van-button 
                        v-else type="info" 
                        round size="small" 
                        icon="plus" class="follow" 
                        @click="toggleFollowUser"
                        :loading="isFollowLoading"
                    >
                        关注
                    </van-button>
                    
                </van-cell>
                <div class="markdown-body" ref="article-content" v-html="article.content"></div>
                <comment-list :source="articleId" :list="commentList" @on-reply="handleReply"/>
            </div>
        </div>
        <div class="article-bottom">
                <van-button class="comment-btn" round icon="edit" @click="isPostPopupShow = true">
                    <span class="text">写评论...</span>
                </van-button>
                <van-icon name="comment-o" class="comment-icon icon" :info="commentList.length > 0 ? commentList.length : ''" />
                <van-icon 
                    :color="article.is_collected ? '#FFB300' : ''"
                    :name="article.is_collected ? 'star' : 'star-o'"
                    @click="handleCollectArticle" 
                    class="icon"
                />
                <van-icon
                    :color="article.attitude === 1 ? 'red' : ''" 
                    :name="article.attitude === 1 ? 'good-job' : 'good-job-o'" 
                    @click="handleLikeArticle"
                    class="icon"
                />
                <van-icon name="share-o" class="icon"/>
        </div>
        <!-- 发布评论 -->
        <van-popup v-model="isPostPopupShow" position="bottom">
            <post-comment :target="articleId" @post-success="onPostSuccess" />
        </van-popup>
        <!-- 回复评论 -->
        <van-popup v-model="isReplyPopupShow" position="bottom">
            <comment-reply 
                v-if="isReplyPopupShow" 
                :comment="replyComment" 
                :articleId="articleId" 
                @close-popup="isReplyPopupShow = false" 
            />
        </van-popup>
    </div>    
</template>

<script>
import { ImagePreview } from 'vant';
import './markdown.css';
import dayjs from '@/api/day';
import { getArticleDeatail, articleCollection, cancelArticleCollection, dislikeArticle, likeArticle } from '@/api/article';
import { followUser, unfollowUser } from '@/api/user';
import CommentList from './components/comment-list';
import PostComment from './components/post-comment'
import CommentReply from './components/comment-reply'

    export default {
        data() {
            return {
                article: {},
                isFollowLoading: false, //关注用户时的加载状态是否显示
                isScrollTopgt120: false, //监听scrollTop
                isPostPopupShow: false, //文章评论的popup
                isReplyPopupShow: false, //回复评论的popup
                replyComment: null,     //回复评论的数据
                commentList: []         //评论列表数据
            }
        },
        components: {
            CommentList,
            PostComment,
            CommentReply
        },
        props: {
            articleId: {
                type: [Number, String, Object],
                required: true
            },
        },
        created () {
            this.loadArticleDetail();
        },
        mounted () {
            window.addEventListener('scroll', this.addScrollEvent)
        },
        methods: {
            async loadArticleDetail() {
                const { data } = await getArticleDeatail(this.articleId);
                this.article = data.data;
                //console.log(this.article)
                document.title = this.article.title;//动态修改页面的title
                this.$nextTick(() => {
                    this.handleImagePreview();
                })
            },
            handleImagePreview() {
                //获取到文章的DOM容器
                const articleContent = this.$refs['article-content'];
                const imgs = articleContent.querySelectorAll('img');
                //获取所有img的src组成的数组
                const imgPaths = Array.from(imgs).map(img => img.src);
                imgs.forEach((img, index) => {
                    img.onclick = function() {
                        ImagePreview({
                            images: imgPaths,
                            startPosition: index,//起始位置
                            loop: false //是否开启循环播放
                        })
                    }
                })
            },
            async toggleFollowUser() { 
                this.isFollowLoading = true;
                if(this.article.is_followed) {
                    //如果已经关注，则取消关注
                    await unfollowUser(this.article.aut_id)
                } else {
                    //如果未关注，则关注
                    await followUser(this.article.aut_id);
                }
                this.article.is_followed = !this.article.is_followed;
                this.isFollowLoading = false;
            },
            async handleCollectArticle() {
                if(this.article.is_collected) {
                    //已收藏，就取消收藏
                    await cancelArticleCollection(this.articleId);
                } else {
                    //没有收藏，就添加收藏
                    await articleCollection(this.articleId);
                }
                this.article.is_collected = !this.article.is_collected;
                this.$toast.success({
                    message: `${this.article.is_collected ? '收藏成功' : '取消成功'}`,
                    icon: 'passed'
                })
            },
            async handleLikeArticle() {
                if(this.article.attitude === 1) {
                    //已经点赞文章，否则取消点赞
                    await dislikeArticle(this.articleId);
                    this.article.attitude = -1;
                } else {
                    //没有点赞，否则点赞文章
                    await likeArticle(this.articleId)
                    this.article.attitude = 1;
                }
            },
            addScrollEvent() {
                const scrollTop = document.documentElement.scrollTop;
                if(scrollTop > 110) {
                    this.isScrollTopgt120 = true;
                    return;
                } else if(scrollTop < 110) {
                    this.isScrollTopgt120 = false;
                    return;
                }
            },
            //处理回复评论
            handleReply(comment) {
                this.replyComment = comment;
                this.isReplyPopupShow = true;
            },
            //提交评论
            onPostSuccess(comment) {
                //关闭评论的弹出层
                this.isPostPopupShow = false;

                //往评论列表中添加评论数据
                this.commentList.unshift(comment);
            }
        },
    }
</script>

<style lang="less" scoped>
.article-container {
    .article-wrap {
        position: fixed;
        left: 0;
        right: 0;
        top: 30px;
        bottom: 40px;
        overflow-y: auto;
    }
    .article-title {
        font-size: 20px;
        color: #3a3a3a;
        padding:14px;
    }
    .avatar {
        width: 35px;
        height: 35px;
        margin-right: 8px;
    }
    .user-name {
        font-size: 14px;
        color: #333;
    }
    .van-cell__label {
        font-size: 10px;
        color: #b4b4b4;
        margin-top: -1px;
    }
    .follow {
        width: 85px;
        height: 32px;
    }
    .markdown-body {
        padding: 14px;
    }
}
.article-bottom {
    width: 100%;
    height: 40px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    background-color:#FAFAFA;
    position: fixed;
    bottom: 0;
    .icon {
        font-size: 24px;
    }
    .comment-btn {
        width: 40%;
        height: 30px;
        border: none;
        background-color: #EEEEEE;
        .text {
            color: #212121;
            font-size: 13px;
        }
    }
    .van-icon-comment-o {
        margin-top: 4px;
    }
    .van-ellipsis {
        transition: .4s;
    }
}
</style>