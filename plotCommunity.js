(window.webpackJsonp=window.webpackJsonp||[]).push([[2],{221:function(t,e,n){"use strict";n.r(e),n.d(e,"plotCommunityWordcloud",(function(){return l}));var a=n(249),r=n(250),o=n(251),s=n(252),c=n(240);const i=Object.assign({},{select:a.a,selectAll:r.a,scaleOrdinal:o.a,schemeTableau10:s.a});function l(t,e=!0){if(null===t.lexical)return;const n=Object.entries(t.lexical).sort((function(t,n){return e?n[1]-t[1]:t[1][0]-n[1][0]})).slice(0,20).map(t=>({text:t[0],size:e?Math.round(2+10*Math.log(t[1])):Math.round(2+10*Math.log(t[1][1]))}));console.log("Community lex has ",Object.keys(n).length," words");const a=Object(o.a)(s.a);let r=i.select("#wordcloud-disp").append("svg").attr("preserveAspectRatio","xMinYMin meet").attr("viewBox","0 0 300 300").classed("svg-content",!0).append("g");const l=c().words(n).padding(5).rotate((function(){return 0})).fontSize(t=>t.size).random(t=>.4).on("end",t=>{r.append("g").attr("transform","translate("+l.size()[0]/2+","+l.size()[1]/2+")").selectAll("text").data(t).enter().append("text").style("font-size",(function(t){return t.size+"px"})).style("fill",(function(t,e){return a(e)})).attr("text-anchor","middle").attr("transform",(function(t){return"translate("+[t.x,t.y]+")rotate("+t.rotate+")"})).text((function(t){return t.text}))});l.start()}}}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9zcmMvcGxvdENvbW11bml0eS5qcyJdLCJuYW1lcyI6WyJkMyIsIk9iamVjdCIsImFzc2lnbiIsInNlbGVjdCIsInNlbGVjdEFsbCIsInNjYWxlT3JkaW5hbCIsInNjaGVtZVRhYmxlYXUxMCIsInBsb3RDb21tdW5pdHlXb3JkY2xvdWQiLCJjb21tSW5mbyIsImlyYW11dGVxTGV4IiwibGV4aWNhbCIsIndvcmRzIiwiZW50cmllcyIsInNvcnQiLCJhIiwiYiIsInNsaWNlIiwibWFwIiwicCIsInRleHQiLCJzaXplIiwiTWF0aCIsInJvdW5kIiwibG9nIiwiY29uc29sZSIsImtleXMiLCJsZW5ndGgiLCJmaWxsU2NhbGUiLCJzdmciLCJhcHBlbmQiLCJhdHRyIiwiY2xhc3NlZCIsImxheW91dCIsInBhZGRpbmciLCJyb3RhdGUiLCJmb250U2l6ZSIsImQiLCJyYW5kb20iLCJvbiIsImRhdGEiLCJlbnRlciIsInN0eWxlIiwiaSIsIngiLCJ5Iiwic3RhcnQiXSwibWFwcGluZ3MiOiIwRkFBQSwrR0FLQSxNQUFNQSxFQUFLQyxPQUFPQyxPQUNkLEdBQ0EsQ0FDSUMsT0FBQSxJQUNBQyxVQUFBLElBQ0FDLGFBQUEsSUFDQUMsZ0JBQUEsTUFLRCxTQUFTQyxFQUF1QkMsRUFBVUMsR0FBWSxHQUN6RCxHQUF5QixPQUFyQkQsRUFBU0UsUUFDVCxPQUNKLE1BQU1DLEVBQVFWLE9BQU9XLFFBQVFKLEVBQVNFLFNBQ2pDRyxNQUFLLFNBQVNDLEVBQUVDLEdBQUksT0FBT04sRUFBY00sRUFBRSxHQUFJRCxFQUFFLEdBQUdBLEVBQUUsR0FBRyxHQUFLQyxFQUFFLEdBQUcsTUFDbkVDLE1BQU0sRUFBRyxJQUNUQyxJQUFLQyxJQUNLLENBQ0hDLEtBQUtELEVBQUUsR0FDUEUsS0FBTVgsRUFBY1ksS0FBS0MsTUFBTSxFQUFJLEdBQUdELEtBQUtFLElBQUlMLEVBQUUsS0FBS0csS0FBS0MsTUFBTSxFQUFJLEdBQUdELEtBQUtFLElBQUlMLEVBQUUsR0FBRyxRQUVsR00sUUFBUUQsSUFBSSxxQkFBc0J0QixPQUFPd0IsS0FBS2QsR0FBT2UsT0FBUSxVQUU3RCxNQUFNQyxFQUFZLFlBQWEsS0FDL0IsSUFBSUMsRUFBTTVCLEVBQUdHLE9BQU8sbUJBQW1CMEIsT0FBTyxPQUN6Q0MsS0FBSyxzQkFBdUIsaUJBQzVCQSxLQUFLLFVBQVcsZUFDaEJDLFFBQVEsZUFBZSxHQUN2QkYsT0FBTyxLQUVaLE1BQU1HLEVBQVMsSUFDVnJCLE1BQU1BLEdBQ05zQixRQUFRLEdBQ1JDLFFBQU8sV0FBYSxPQUFPLEtBQzNCQyxTQUFTQyxHQUFLQSxFQUFFaEIsTUFDaEJpQixPQUFPRCxHQUFLLElBQ1pFLEdBQUcsTUFBTzNCLElBQ1BpQixFQUNLQyxPQUFPLEtBQ1BDLEtBQUssWUFBYSxhQUFlRSxFQUFPWixPQUFPLEdBQUssRUFBSSxJQUFNWSxFQUFPWixPQUFPLEdBQUssRUFBSSxLQUNyRmhCLFVBQVUsUUFDVm1DLEtBQUs1QixHQUNMNkIsUUFBUVgsT0FBTyxRQUNmWSxNQUFNLGFBQWEsU0FBU0wsR0FBSyxPQUFPQSxFQUFFaEIsS0FBTyxRQUNqRHFCLE1BQU0sUUFBUSxTQUFVTCxFQUFHTSxHQUFLLE9BQU9mLEVBQVVlLE1BQ2pEWixLQUFLLGNBQWUsVUFDcEJBLEtBQUssYUFBYSxTQUFTTSxHQUN4QixNQUFPLGFBQWUsQ0FBQ0EsRUFBRU8sRUFBR1AsRUFBRVEsR0FBSyxXQUFhUixFQUFFRixPQUFTLE9BRTlEZixNQUFLLFNBQVNpQixHQUFLLE9BQU9BLEVBQUVqQixVQUV6Q2EsRUFBT2EiLCJmaWxlIjoicGxvdENvbW11bml0eS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNlbGVjdCwgc2VsZWN0QWxsIH0gZnJvbSAnZDMtc2VsZWN0aW9uJztcbmltcG9ydCB7IHNjYWxlT3JkaW5hbCB9IGZyb20gJ2QzLXNjYWxlJztcbmltcG9ydCB7IHNjaGVtZVRhYmxlYXUxMCB9IGZyb20gJ2QzLXNjYWxlLWNocm9tYXRpYyc7XG5pbXBvcnQgKiBhcyBjbG91ZCBmcm9tICdkMy1jbG91ZCc7XG5cbmNvbnN0IGQzID0gT2JqZWN0LmFzc2lnbihcbiAgICB7fSxcbiAgICB7XG4gICAgICAgIHNlbGVjdCxcbiAgICAgICAgc2VsZWN0QWxsLFxuICAgICAgICBzY2FsZU9yZGluYWwsXG4gICAgICAgIHNjaGVtZVRhYmxlYXUxMFxuICAgIH0sXG4gIC8vICByZXF1ZXN0XG4pXG5cbmV4cG9ydCBmdW5jdGlvbiBwbG90Q29tbXVuaXR5V29yZGNsb3VkKGNvbW1JbmZvLCBpcmFtdXRlcUxleD10cnVlKSB7XG4gICAgaWYgKGNvbW1JbmZvLmxleGljYWwgPT09IG51bGwpXG4gICAgICAgIHJldHVybjtcbiAgICBjb25zdCB3b3JkcyA9IE9iamVjdC5lbnRyaWVzKGNvbW1JbmZvLmxleGljYWwpXG4gICAgICAgIC5zb3J0KGZ1bmN0aW9uKGEsYikge3JldHVybiBpcmFtdXRlcUxleCA/IGJbMV0tIGFbMV06YVsxXVswXSAtIGJbMV1bMF19KVxuICAgICAgICAuc2xpY2UoMCwgMjApIC8vIHRha2Ugb25seSA1MCBmaXJzdCB3b3Jkc1xuICAgICAgICAubWFwKChwKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRleHQ6cFswXSxcbiAgICAgICAgICAgICAgICBzaXplOiBpcmFtdXRlcUxleCA/IE1hdGgucm91bmQoMiArIDEwKk1hdGgubG9nKHBbMV0pKTpNYXRoLnJvdW5kKDIgKyAxMCpNYXRoLmxvZyhwWzFdWzFdKSl9O1xuICAgICAgICB9KTtcbiAgICBjb25zb2xlLmxvZyhcIkNvbW11bml0eSBsZXggaGFzIFwiLCBPYmplY3Qua2V5cyh3b3JkcykubGVuZ3RoLCBcIiB3b3Jkc1wiKTtcblxuICAgIGNvbnN0IGZpbGxTY2FsZSA9IHNjYWxlT3JkaW5hbChzY2hlbWVUYWJsZWF1MTApO1xuICAgIGxldCBzdmcgPSBkMy5zZWxlY3QoXCIjd29yZGNsb3VkLWRpc3BcIikuYXBwZW5kKFwic3ZnXCIpXG4gICAgICAgIC5hdHRyKFwicHJlc2VydmVBc3BlY3RSYXRpb1wiLCBcInhNaW5ZTWluIG1lZXRcIilcbiAgICAgICAgLmF0dHIoXCJ2aWV3Qm94XCIsIFwiMCAwIDMwMCAzMDBcIilcbiAgICAgICAgLmNsYXNzZWQoXCJzdmctY29udGVudFwiLCB0cnVlKVxuICAgICAgICAuYXBwZW5kKFwiZ1wiKVxuXG4gICAgY29uc3QgbGF5b3V0ID0gY2xvdWQoKVxuICAgICAgICAud29yZHMod29yZHMpXG4gICAgICAgIC5wYWRkaW5nKDUpXG4gICAgICAgIC5yb3RhdGUoZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9KVxuICAgICAgICAuZm9udFNpemUoZCA9PiBkLnNpemUpXG4gICAgICAgIC5yYW5kb20oZCA9PiAwLjQpIC8vIHRyeSB0byBrZWVwIGxheW91dCBiZXR3ZWVuIHJlZnJlc2hcbiAgICAgICAgLm9uKFwiZW5kXCIsIHdvcmRzID0+IHtcbiAgICAgICAgICAgIHN2Z1xuICAgICAgICAgICAgICAgIC5hcHBlbmQoXCJnXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgXCJ0cmFuc2xhdGUoXCIgKyBsYXlvdXQuc2l6ZSgpWzBdIC8gMiArIFwiLFwiICsgbGF5b3V0LnNpemUoKVsxXSAvIDIgKyBcIilcIilcbiAgICAgICAgICAgICAgICAuc2VsZWN0QWxsKFwidGV4dFwiKVxuICAgICAgICAgICAgICAgIC5kYXRhKHdvcmRzKVxuICAgICAgICAgICAgICAgIC5lbnRlcigpLmFwcGVuZChcInRleHRcIilcbiAgICAgICAgICAgICAgICAuc3R5bGUoXCJmb250LXNpemVcIiwgZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5zaXplICsgXCJweFwiOyB9KVxuICAgICAgICAgICAgICAgIC5zdHlsZShcImZpbGxcIiwgZnVuY3Rpb24gKGQsIGkpIHsgcmV0dXJuIGZpbGxTY2FsZShpKTsgfSlcbiAgICAgICAgICAgICAgICAuYXR0cihcInRleHQtYW5jaG9yXCIsIFwibWlkZGxlXCIpXG4gICAgICAgICAgICAgICAgLmF0dHIoXCJ0cmFuc2Zvcm1cIiwgZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJ0cmFuc2xhdGUoXCIgKyBbZC54LCBkLnldICsgXCIpcm90YXRlKFwiICsgZC5yb3RhdGUgKyBcIilcIjtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50ZXh0KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQudGV4dDsgfSk7XG4gICAgICAgIH0pO1xuICAgIGxheW91dC5zdGFydCgpO1xufVxuXG4iXSwic291cmNlUm9vdCI6IiJ9