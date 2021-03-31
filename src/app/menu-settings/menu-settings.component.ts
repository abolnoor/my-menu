import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Injectable, ElementRef, ViewChild, Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { BehaviorSubject } from 'rxjs';
import { MenuItem } from '../menu-item';
import { MenuService } from '../menu.service';

/**
 * Node for menu item
 */
export class MenuItemNode {
  children!: MenuItemNode[];
  name!: string;
  link!: string;
}

/** Flat menu item node with expandable and level information */
export class MenuItemFlatNode {
  name!: string;
  link!: string;
  level!: number;
  expandable!: boolean;
}

/**
 * The Json object for menu list data.
 */
const TREE_DATA = {
  aaa:['aaalll', {aaac1:['aaac1l', {
    aaac1c1:['', {}],aaac1c2:['', {}],aaac1c3:['', {}]
  }],aaac2:['aaac2l', {}],aaac3:['aaac3l', {}]}],
  bbb:['bbblll', {bbbc1:['bbbc1l', {}],bbbc2:['bbbc2l', {}],bbbc3:['bbbc3l', {}]}]
};

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a menu item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<MenuItemNode[]>([]);

  get data(): MenuItemNode[] { return this.dataChange.value; }

  constructor(private menuService: MenuService) {
    this.initialize();
  }

  initialize() {
    // Build the tree nodes from Json object. The result is a list of `MenuItemNode` with nested
    //     file node as children.
    //const data = this.buildMenuTree(TREE_DATA, 0);
    const data = this.menuService.getMainMenu();
    // Notify the change.
    this.dataChange.next(data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `MenuItemNode`.
   */
  buildMenuTree(obj: any, level: number): MenuItemNode[] {
    return Object.keys(obj).reduce<MenuItemNode[]>((accumulator, key, idx) => {
      const value = obj[key];
      const node = new MenuItemNode();
      node.name = key;

      if (value != null) {
        if (typeof value === 'object') {
          node.link = value[0];
          node.children = this.buildMenuTree(value[1], level + 1);
        } else {
          node.link = value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  /** Add an item to menu list */
  insertItem(parent: MenuItemNode, data: any): MenuItemNode {
    const newItem = {name: data.name, link:data.link} as MenuItemNode;
    if(parent){
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(newItem);
    } else{
      this.data.push(newItem)
    }
        
    this.dataChange.next(this.data);
    this.menuService.setMainMenu(this.data);
    return newItem;
  }

  insertItemAbove(node: MenuItemNode, data: any): MenuItemNode {
    const parentNode = this.getParentFromNodes(node);
    const newItem = {name: data.name, link:data.link} as MenuItemNode;
    if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node), 0, newItem);
    } else {
      this.data.splice(this.data.indexOf(node), 0, newItem);
    }
    
    this.dataChange.next(this.data);
    this.menuService.setMainMenu(this.data);
    return newItem;
  }

  insertItemBelow(node: MenuItemNode,data: any): MenuItemNode {
    const parentNode = this.getParentFromNodes(node);
    const newItem = {name: data.name, link:data.link} as MenuItemNode;
    if (parentNode != null) {
      parentNode.children.splice(parentNode.children.indexOf(node) + 1, 0, newItem);
    } else {
      this.data.splice(this.data.indexOf(node) + 1, 0, newItem);
    }
    this.dataChange.next(this.data);
    this.menuService.setMainMenu(this.data);
    return newItem;
  }

  getParentFromNodes(node: MenuItemNode): MenuItemNode|null {
    for (let i = 0; i < this.data.length; ++i) {
      const currentRoot = this.data[i];
      const parent = this.getParent(currentRoot, node);
      if (parent != null) {
        return parent;
      }
    }
    return null;
  }

  getParent(currentRoot: MenuItemNode, node: MenuItemNode): MenuItemNode|null {
    if (currentRoot.children && currentRoot.children.length > 0) {
      for (let i = 0; i < currentRoot.children.length; ++i) {
        const child = currentRoot.children[i];
        if (child === node) {
          return currentRoot;
        } else if (child.children && child.children.length > 0) {
          const parent = this.getParent(child, node);
          if (parent != null) {
            return parent;
          }
        }
      }
    }
    return null;
  }

  updateItem(node: MenuItemNode, data: any) {
      node.name = data.name;
      node.link = data.link;
      this.dataChange.next(this.data);
    this.menuService.setMainMenu(this.data);    
  }

  deleteItem(node: MenuItemNode) {    
    this.deleteNode(this.data, node);
    this.dataChange.next(this.data);
    this.menuService.setMainMenu(this.data);
  }

  copyPasteItem(from: MenuItemNode, to: MenuItemNode): MenuItemNode {
    const newItem = this.insertItem(to, from);
    if (from.children) {
      from.children.forEach(child => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  copyPasteItemAbove(from: MenuItemNode, to: MenuItemNode): MenuItemNode {
    const newItem = this.insertItemAbove(to, from);
    if (from.children) {
      from.children.forEach(child => {
        this.copyPasteItem(child, newItem);
      });
    }
    
    return newItem;
  }

  copyPasteItemBelow(from: MenuItemNode, to: MenuItemNode): MenuItemNode {
    const newItem = this.insertItemBelow(to, from);
    if (from.children) {
      from.children.forEach(child => {
        this.copyPasteItem(child, newItem);
      });
    }
    return newItem;
  }

  deleteNode(nodes: MenuItemNode[], nodeToDelete: MenuItemNode) {
    const index = nodes.indexOf(nodeToDelete, 0);
    if (index > -1) {
      nodes.splice(index, 1);
      
    } else {
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          this.deleteNode(node.children, nodeToDelete);
        }
      });
    }
  }
}

@Component({
  selector: 'app-menu-settings',
  templateUrl: './menu-settings.component.html',
  styleUrls: ['./menu-settings.component.scss'],
  providers: [ChecklistDatabase]
})
export class MenuSettingsComponent {
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<MenuItemFlatNode, MenuItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<MenuItemNode, MenuItemFlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: MenuItemFlatNode | null = null;

  /** The new item's name */
  newItemName = '';

  treeControl: FlatTreeControl<MenuItemFlatNode>;

  treeFlattener: MatTreeFlattener<MenuItemNode, MenuItemFlatNode>;

  dataSource: MatTreeFlatDataSource<MenuItemNode, MenuItemFlatNode>;


  /* Drag and drop */
  dragNode: any;
  dragNodeExpandOverWaitTimeMs = 300;
  dragNodeExpandOverNode: any;
  dragNodeExpandOverTime!: number;
  dragNodeExpandOverArea!: string;
  @ViewChild('emptyItem')
  emptyItem!: ElementRef;

  constructor(private database: ChecklistDatabase, public dialog: MatDialog) {
    this.treeFlattener = new MatTreeFlattener(this.transformer, this.getLevel, this.isExpandable, this.getChildren);
    this.treeControl = new FlatTreeControl<MenuItemFlatNode>(this.getLevel, this.isExpandable);
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    database.dataChange.subscribe(data => {
      this.dataSource.data = [];
      this.dataSource.data = data;
    });
  }

  getLevel = (node: MenuItemFlatNode) => node.level;

  isExpandable = (node: MenuItemFlatNode) => node.expandable;

  getChildren = (node: MenuItemNode): MenuItemNode[] => node.children;

  hasChild = (_: number, _nodeData: MenuItemFlatNode) => _nodeData.expandable;

  hasNoContent = (_: number, _nodeData: MenuItemFlatNode) => _nodeData.name === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: MenuItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode = existingNode && existingNode.name === node.name
      ? existingNode
      : new MenuItemFlatNode();
    flatNode.name = node.name;
    flatNode.link = node.link;
    flatNode.level = level;
    flatNode.expandable = (node.children && node.children.length > 0);
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  }

  /** Select the category so we can insert the new item. */
  addNewItem(node: MenuItemFlatNode, data: any) {
      const parentNode = this.flatNodeMap.get(node);
      this.database.insertItem(parentNode!, data);
      this.treeControl.expand(node);
    
  }

  /** Save the node to database */
  saveNode(node: MenuItemFlatNode, itemValue: string) {
    const nestedNode = this.flatNodeMap.get(node);
    this.database.updateItem(nestedNode!, itemValue);
  }

  handleDragStart(event: any, node: MenuItemFlatNode) {
    // Required by Firefox (https://stackoverflow.com/questions/19055264/why-doesnt-html5-drag-and-drop-work-in-firefox)
    event.dataTransfer.setData('foo', 'bar');
    event.dataTransfer.setDragImage(this.emptyItem.nativeElement, 0, 0);
    this.dragNode = node;
    this.treeControl.collapse(node);
  }

  handleDragOver(event: any, node: MenuItemFlatNode) {
    event.preventDefault();

    // Handle node expand
    if (node === this.dragNodeExpandOverNode) {
      if (this.dragNode !== node && !this.treeControl.isExpanded(node)) {
        if ((new Date().getTime() - this.dragNodeExpandOverTime) > this.dragNodeExpandOverWaitTimeMs) {
          this.treeControl.expand(node);
        }
      }
    } else {
      this.dragNodeExpandOverNode = node;
      this.dragNodeExpandOverTime = new Date().getTime();
    }

    // Handle drag area
    const percentageX = event.offsetX / event.target.clientWidth;
    const percentageY = event.offsetY / event.target.clientHeight;
    if (percentageY < 0.25) {
      this.dragNodeExpandOverArea = 'above';
    } else if (percentageY > 0.75) {
      this.dragNodeExpandOverArea = 'below';
    } else {
      this.dragNodeExpandOverArea = 'center';
    }
  }

  handleDrop(event: any, node: MenuItemFlatNode) {
    event.preventDefault();
    if (node !== this.dragNode) {
      let newItem: MenuItemNode;
      if (this.dragNodeExpandOverArea === 'above') {
        newItem = this.database.copyPasteItemAbove(this.flatNodeMap.get(this.dragNode)!, this.flatNodeMap.get(node)!);
      } else if (this.dragNodeExpandOverArea === 'below') {
        newItem = this.database.copyPasteItemBelow(this.flatNodeMap.get(this.dragNode)!, this.flatNodeMap.get(node)!);
      } else {
        newItem = this.database.copyPasteItem(this.flatNodeMap.get(this.dragNode)!, this.flatNodeMap.get(node)!);
      }      
      this.database.deleteItem(this.flatNodeMap.get(this.dragNode)!);
      this.treeControl.expandDescendants(this.nestedNodeMap.get(newItem)!);
    }
    this.dragNode = null;
    this.dragNodeExpandOverNode = null;
    this.dragNodeExpandOverTime = 0;
  }

  handleDragEnd(event: any) {
    this.dragNode = null;
    this.dragNodeExpandOverNode = null;
    this.dragNodeExpandOverTime = 0;
  }

deleteMenuItem(node: any){
  this.database.deleteItem(this.flatNodeMap.get(node)!);
}

  openDialog(node?: any, add?: boolean): void {
    const dialogRef = this.dialog.open(MenuDialog, {
      width: '250px',
      data: {name: !add? node.name : '', link: !add ? node.link : ''}
    });

    dialogRef.afterClosed().subscribe((result: MenuItemFlatNode) => {
    if(!add && node){
      const nestedNode = this.flatNodeMap.get(node);
      this.database.updateItem(nestedNode!, result);
    } else {
      this.addNewItem(node, result);
    }
     
    });
  }
}


@Component({
  selector: 'menu-dialog',
  templateUrl: 'menu-dialog.html',
})
export class MenuDialog {

  constructor(
    public dialogRef: MatDialogRef<MenuDialog>,
    @Inject(MAT_DIALOG_DATA) public data: MenuItemNode) {}

  cancel(): void {
    this.dialogRef.close();
  }

}