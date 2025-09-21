import random
import pandas as pd
import datetime

# 准备一些示例数据
initiators = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah"]
participants = ["Ivan", "Judy", "Kevin", "Laura", "Mike", "Nina", "Oscar", "Paula", "Quinn", "Rita"]
topics = [
    "Web3 and Society", "Intro to Blockchain", "DIY Hardware Wallet", "Tauri for Desktop Apps",
    "Agent CLI Deep Dive", "Co-Learning Kickoff", "Global Hackathon Trends", "Crypto in Argentina",
    "Holacracy in Startups", "Creative Coding Jam"
]
venues = ["Cafe", "Online Zoom Room", "Makerspace A1", "Community Hall", "Library Room 3", "Virtual Discord"]

# 随机生成时间（未来一个月内的日期，随机时段）
def random_datetime():
    start_date = datetime.datetime.now()
    end_date = start_date + datetime.timedelta(days=30)
    random_date = start_date + (end_date - start_date) * random.random()
    random_time = datetime.timedelta(
        hours=random.randint(9, 20),  # 活动时间在上午9点到晚上8点之间
        minutes=random.choice([0, 15, 30, 45])
    )
    return (random_date.replace(hour=0, minute=0, second=0, microsecond=0) + random_time).strftime("%Y-%m-%d %H:%M")

# 生成 50 行随机数据
data = []
for _ in range(50):
    initiator = random.choice(initiators)
    participant = random.choice(participants)
    topic = random.choice(topics)
    venue = random.choice(venues)
    time = random_datetime()
    data.append([initiator, participant, topic, venue, time])

# 创建 DataFrame
df = pd.DataFrame(data, columns=["发起人姓名", "参与人姓名", "活动主题", "活动场地", "活动时间"])

df.to_csv("mock_community_events.csv", index=False)
