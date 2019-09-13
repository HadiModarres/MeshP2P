function hello(callback) {
    callback();
}

class Test {
   constructor(){
   }
   test2(){
       const a = [];
       a.push("a1");
       console.log(a);
   }

   test(){
       hello( () =>{
           this.hello2();
       });
   }

   hello2(){
       console.log("hello2");
   }
}

new Test().test2();
