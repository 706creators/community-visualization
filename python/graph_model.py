import pandas as pd
import networkx as nx
import json

# 1. 定义 Node 类
class Member:
    def __init__(self, name):
        self.id = f"member:{name}"
        self.name = name
        self.type = "member"

class Event:
    def __init__(self, topic, time):
        self.id = f"event:{topic}@{time}"
        self.topic = topic
        self.time = time
        self.type = "event"

class Space:
    def __init__(self, name):
        self.id = f"space:{name}"
        self.name = name
        self.type = "space"

# 2. CSV 导入接口
def import_csv(filepath):
    df = pd.read_csv(filepath)
    return df

# 3. 构造图关系
def build_graph(df):
    G = nx.DiGraph()
    node_objs = {}

    for _, row in df.iterrows():
        # 创建节点对象
        initiator = row['发起人姓名']
        participant = row['参与人姓名']
        topic = row['活动主题']
        time = row['活动时间']
        space_name = row['活动场地']

        member_initiator = node_objs.setdefault(initiator, Member(initiator))
        member_participant = node_objs.setdefault(participant, Member(participant))
        event = node_objs.setdefault(f"{topic}@{time}", Event(topic, time))
        space = node_objs.setdefault(space_name, Space(space_name))

        # 添加节点
        G.add_node(member_initiator.id, **member_initiator.__dict__)
        G.add_node(member_participant.id, **member_participant.__dict__)
        G.add_node(event.id, **event.__dict__)
        G.add_node(space.id, **space.__dict__)

        # 添加边
        G.add_edge(member_initiator.id, event.id, type="initiates")
        G.add_edge(event.id, member_participant.id, type="participates")
        G.add_edge(space.id, event.id, type="hosts")

    return G

# 4. 导出为 JSON（前端可用）
def export_graph_json(G):
    nodes = []
    for node_id, attrs in G.nodes(data=True):
        nodes.append({
            "id": node_id,
            "type": attrs.get("type"),
            "name": attrs.get("name", attrs.get("topic", "")),
            "topic": attrs.get("topic", ""),
            "time": attrs.get("time", ""),
        })

    edges = []
    for source, target, attrs in G.edges(data=True):
        edges.append({
            "source": source,
            "target": target,
            "type": attrs.get("type")
        })

    return json.dumps({"nodes": nodes, "edges": edges}, ensure_ascii=False, indent=2)

# 示例用法
if __name__ == "__main__":
    df = import_csv("mock_community_events.csv")
    G = build_graph(df)
    graph_json = export_graph_json(G)
    with open("graph_data.json", "w", encoding="utf-8") as f:
        f.write(graph_json)
    print("图数据已导出为 graph_data.json")