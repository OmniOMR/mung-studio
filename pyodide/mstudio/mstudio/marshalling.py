import numpy as np
from typing import TypeVar
from mung.node import Node

T = TypeVar("T")

def unwrap_proxy(possible_proxy: T) -> T:
    """If the given object is a JsProxy, it gets converted to a value"""
    if hasattr(possible_proxy, "to_py"):
        return possible_proxy.to_py()
    return possible_proxy


#############
# Mask RGBA #
#############

def marshal_mask_rgba(mask: np.ndarray) -> tuple[int, int, np.ndarray]:
    """Prepare a mask to be sent back to javascript"""
    assert mask.dtype == np.uint8 # bytes
    assert len(mask.shape) == 3 # HxWxC
    assert mask.shape[2] == 4 # RGBA

    return (mask.shape[1], mask.shape[0], mask.flatten())

def unmarshal_mask_rgba(
        marshalled_mask: tuple[int, int, memoryview]
) -> np.ndarray:
    """Receive a mask sent from javascript"""
    width, height, data = marshalled_mask
    data = unwrap_proxy(data)

    mask = np.asarray(data, dtype=np.uint8).reshape((height, width, 4))
    
    assert mask.dtype == np.uint8 # bytes
    assert len(mask.shape) == 3 # HxWxC
    assert mask.shape[2] == 4 # RGBA

    return mask


#############
# MuNG Node #
#############

def marshal_mung_node(node: Node) -> dict:
    """Prepare a MuNG node to be sent back to javascript"""
    # convert mask format
    mask = None
    if node.mask is not None:
        color = node.mask * 255 # from 0/1 to grayscale 0-255
        mask = np.zeros(shape=(node.height, node.width, 4), dtype=np.uint8)
        mask[:, :, 0] = color # red
        mask[:, :, 3] = color # alpha

    return {
        "id": node.id,
        "className": node.class_name,
        "top": node.top,
        "left": node.left,
        "width": node.width,
        "height": node.height,
        "outlinks": node.outlinks,
        "inlinks": node.inlinks,
        "mask": marshal_mask_rgba(mask) if mask is not None else None,
        "data": node.data,
    }

def unmarshal_mung_node(marshalled_node: dict) -> Node:
    """Receive a MuNG node sent from javascript"""
    marshalled_node = unwrap_proxy(marshalled_node)
    
    mask = None
    if marshalled_node.get("mask") is not None:
        mask_rgba = unmarshal_mask_rgba(marshalled_node["mask"])
        mask = mask_rgba[:, :, 3] // 255 # alpha downscaled to 0/1
    
    md: dict = marshalled_node["data"]
    data = {
        "precedence_outlinks": [int(l) for l in md["precedence_outlinks"]],
        "precedence_inlinks": [int(l) for l in md["precedence_inlinks"]],
        "text_transcription": md["text_transcription"],
    }

    return Node(
        id_=int(marshalled_node["id"]),
        class_name=str(marshalled_node["className"]),
        top=int(marshalled_node["top"]),
        left=int(marshalled_node["left"]),
        width=int(marshalled_node["width"]),
        height=int(marshalled_node["height"]),
        outlinks=[int(l) for l in marshalled_node["outlinks"]],
        inlinks=[int(l) for l in marshalled_node["inlinks"]],
        mask=mask,
        data=data,
    )

def marshal_mung_nodes(nodes: list[Node]) -> list[dict]:
    """Prepare a list of MuNG nodes to be sent back to javascript"""
    return [marshal_mung_node(n) for n in nodes]

def unmarshal_mung_nodes(marshalled_nodes: list[dict]) -> list[Node]:
    """Receive a list of MuNG nodes send from javascript"""
    marshalled_nodes = unwrap_proxy(marshalled_nodes)
    return [unmarshal_mung_node(n) for n in marshalled_nodes]
